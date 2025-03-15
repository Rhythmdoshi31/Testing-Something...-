const express = require("express");
const router = express.Router();
const Container = require("../models/Container");
const Item = require("../models/Item");

// Function to track container space using a 3D grid
class ContainerSpace {
    constructor(container) {
        this.containerId = container.containerId;
        this.width = container.width;
        this.depth = container.depth;
        this.height = container.height;

        // 3D Grid to track used space (false = empty, true = occupied)
        this.space = Array.from({ length: this.width }, () =>
            Array.from({ length: this.depth }, () =>
                Array(this.height).fill(false)
            )
        );
    }

    canFitItem(item) {
        for (let x = 0; x <= this.width - item.width; x++) {
            for (let y = 0; y <= this.depth - item.depth; y++) {
                for (let z = 0; z <= this.height - item.height; z++) {
                    if (this.isSpaceAvailable(x, y, z, item)) {
                        return { x, y, z };
                    }
                }
            }
        }
        return null;
    }

    isSpaceAvailable(x, y, z, item) {
        for (let dx = 0; dx < item.width; dx++) {
            for (let dy = 0; dy < item.depth; dy++) {
                for (let dz = 0; dz < item.height; dz++) {
                    if (this.space[x + dx][y + dy][z + dz]) {
                        return false; // Space is occupied
                    }
                }
            }
        }
        return true;
    }

    placeItem(item, x, y, z) {
        for (let dx = 0; dx < item.width; dx++) {
            for (let dy = 0; dy < item.depth; dy++) {
                for (let dz = 0; dz < item.height; dz++) {
                    this.space[x + dx][y + dy][z + dz] = true; // Mark space as occupied
                }
            }
        }
        return { x, y, z };
    }
}

// Optimized placement algorithm
async function placeItems(items, containers) {
    // Sort containers by available space (largest first)
    containers.sort((a, b) =>
        b.width * b.depth * b.height - a.width * a.depth * a.height
    );

    let placements = [];
    let containerSpaces = containers.map(container => new ContainerSpace(container));

    for (let item of items) {
        console.log(`🔍 Checking Item: ${item.itemId}, Space Needed: ${item.width * item.depth * item.height}`);

        let placed = false;

        for (let container of containerSpaces) {
            let remainingSpace = container.width * container.depth * container.height;
            console.log(`✅ Checking Container: ${container.containerId}, Remaining Space: ${remainingSpace}`);

            // ❌ **Fix: Skip items that are too large**
            if (item.width > container.width || item.depth > container.depth || item.height > container.height) {
                console.log(`❌ Item ${item.itemId} is too large for Container ${container.containerId}`);
                continue;
            }

            let position = container.canFitItem(item);
            if (position) {
                container.placeItem(item, position.x, position.y, position.z);
                placements.push({
                    itemId: item.itemId,
                    containerId: container.containerId,
                    position: {
                        startCoordinates: { width: position.x, depth: position.y, height: position.z },
                        endCoordinates: {
                            width: position.x + item.width,
                            depth: position.y + item.depth,
                            height: position.z + item.height
                        }
                    }
                });

                // Save placement to MongoDB
                await Item.updateOne(
                    { itemId: item.itemId },
                    {
                        $set: {
                            containerId: container.containerId,
                            position: {
                                startCoordinates: { width: position.x, depth: position.y, height: position.z },
                                endCoordinates: {
                                    width: position.x + item.width,
                                    depth: position.y + item.depth,
                                    height: position.z + item.height
                                }
                            }
                        }
                    },
                    { upsert: true } // Creates the item if it doesn't exist
                );
                console.log(`✅ Saved Item: ${item.itemId} to DB`);

                placed = true;
                break;
            }
        }

        if (!placed) {
            console.log(`❌ No Suitable Container for Item: ${item.itemId}`);
        }
    }

    return { success: true, placements };
}

// Placement API Endpoint
router.post("/placement", async (req, res) => {
    try {
        console.log("🛠️ Incoming Placement Request:", JSON.stringify(req.body, null, 2));

        const { items, containers } = req.body;

        // Retrieve containers and items from DB
        const dbContainers = await Container.find({});
        const dbItemsFromDB = await Item.find({ itemId: { $in: items.map(i => i.itemId) } });

        // Merge request items with DB items
        const dbItems = items.map(reqItem => {
            const dbItem = dbItemsFromDB.find(dbItem => dbItem.itemId === reqItem.itemId);
            return {
                ...reqItem,  // Keep request body dimensions
                ...(dbItem || {}) // Merge missing properties from DB
            };
        });

        console.log("✅ Items from DB:", dbItems);
        console.log("✅ Containers from DB:", dbContainers);

        // Run optimized placement algorithm
        const placements = await placeItems(dbItems, dbContainers);

        console.log("🚀 Final Placements:", placements);

        res.json(placements);
    } catch (error) {
        console.error("❌ Error in placement:", error);
        res.status(500).json({ success: false, message: "Placement failed", error });
    }
});

module.exports = router;
