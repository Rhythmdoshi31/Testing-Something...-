const express = require("express");
const router = express.Router();
const Container = require("../models/Container");
const Item = require("../models/Item");

// Knapsack-like function to fit items optimally
function findBestPlacement(items, containers) {
    items.sort((a, b) => a.priority - b.priority || new Date(a.expiryDate) - new Date(b.expiryDate));

    let placements = [];

    for (let item of items) {
        console.log(`🔍 Checking Item: ${JSON.stringify(item)}`); // Debugging log

        let bestContainer = null;
        let minWaste = Infinity;

        // Check if item has valid dimensions
        if (!item.width || !item.depth || !item.height) {
            console.log(`❌ Item ${item.itemId} has invalid dimensions: ${item.width}, ${item.depth}, ${item.height}`);
            continue;
        }

        let itemSpace = item.width * item.depth * item.height;
        console.log(`✅ Item ${item.itemId} - Space Needed: ${itemSpace}`);

        for (let container of containers) {
            let remainingSpace = container.width * container.depth * container.height;
            console.log(`✅ Checking Container: ${container.containerId}, Remaining Space: ${remainingSpace}`);

            if (itemSpace <= remainingSpace && remainingSpace - itemSpace < minWaste) {
                bestContainer = container;
                minWaste = remainingSpace - itemSpace;
            }
        }

        if (bestContainer) {
            console.log(`✅ Placing Item: ${item.itemId} in Container: ${bestContainer.containerId}`);
            placements.push({
                itemId: item.itemId,
                containerId: bestContainer.containerId,
                position: {
                    startCoordinates: { width: 0, depth: 0, height: 0 },
                    endCoordinates: { width: item.width, depth: item.depth, height: item.height }
                }
            });
        } else {
            console.log(`❌ No Suitable Container for Item: ${item.itemId}`);
        }
    }

    return placements;
}

router.post("/placement", async (req, res) => {
    try {
        console.log("🛠️ Incoming Placement Request:", JSON.stringify(req.body, null, 2));

        const { items, containers } = req.body;

        // Retrieve containers and items from DB
        const dbContainers = await Container.find({});
        const dbItems = await Item.find({ itemId: { $in: items.map(i => i.itemId) } });

        console.log("✅ Items from DB:", dbItems);
        console.log("✅ Containers from DB:", dbContainers);

        // Run optimized placement algorithm
        const placements = findBestPlacement(dbItems, dbContainers);

        console.log("🚀 Final Placements:", placements);

        res.json({ success: true, placements });
    } catch (error) {
        console.error("❌ Error in placement:", error);
        res.status(500).json({ success: false, message: "Placement failed", error });
    }
});

module.exports = router;
