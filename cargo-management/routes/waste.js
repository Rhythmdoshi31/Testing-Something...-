const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

// Identify expired or overused items
router.get("/waste/identify", async (req, res) => {
    try {
        const currentDate = new Date();

        // Find expired items or those that exceeded usage limit
        const wasteItems = await Item.find({
            $or: [
                { expiryDate: { $lt: currentDate } },  // Expired items
                { $expr: { $gte: ["$usageCount", "$usageLimit"] } }  // Overused items
            ]
        });

        const response = wasteItems.map(item => ({
            itemId: item.itemId,
            name: item.name,
            reason: item.expiryDate < currentDate ? "Expired" : "Out of Uses",
            containerId: item.containerId,
            position: item.position
        }));

        res.json({ success: true, wasteItems: response });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error identifying waste items", error });
    }
});

router.post("/waste/return-plan", async (req, res) => {
    try {
        const { undockingContainerId, undockingDate, maxWeight } = req.body;

        console.log("\n🔎 DEBUG: Searching for waste items in container:", undockingContainerId);
        console.log("🔎 DEBUG: Current date:", new Date());

        // Query to find waste items
        const wasteItems = await Item.find({
            containerId: undockingContainerId,
            $or: [
                { expiryDate: { $lt: new Date() } },  // Expired items
                { $expr: { $gte: ["$usageCount", "$usageLimit"] } }  // Overused items
            ]
        });

        console.log("✅ DEBUG: Waste Items Found:", wasteItems);

        if (wasteItems.length === 0) {
            console.log("❌ DEBUG: No waste items found for removal.");
            return res.json({
                success: true,
                returnPlan: [],
                retrievalSteps: [],
                returnManifest: {
                    undockingContainerId,
                    undockingDate,
                    returnItems: [],
                    totalWeight: 0
                }
            });
        }

        let totalWeight = 0;
        let returnItems = [];
        let retrievalSteps = [];
        let returnPlan = [];

        wasteItems.forEach((item, index) => {
            if (totalWeight + (item.weight || 5) <= maxWeight) { // Default weight if missing
                returnItems.push({
                    itemId: item.itemId,
                    name: item.name,
                    reason: item.expiryDate < new Date() ? "Expired" : "Out of Uses"
                });

                retrievalSteps.push({
                    step: index + 1,
                    action: "remove",
                    itemId: item.itemId,
                    itemName: item.name
                });

                returnPlan.push({
                    step: index + 1,
                    itemId: item.itemId,
                    itemName: item.name,
                    fromContainer: undockingContainerId,
                    toContainer: "Waste Storage"
                });

                totalWeight += item.weight || 5; // Assign default weight if missing
            }
        });

        console.log("✅ DEBUG: Final Return Plan:", returnPlan);

        res.json({
            success: true,
            returnPlan,
            retrievalSteps,
            returnManifest: {
                undockingContainerId,
                undockingDate,
                returnItems,
                totalWeight
            }
        });

    } catch (error) {
        console.error("🚨 DEBUG: Error in return-plan API:", error);
        res.status(500).json({ success: false, message: "Error generating return plan", error });
    }
});


router.post("/waste/complete-undocking", async (req, res) => {
    try {
        const { undockingContainerId, timestamp } = req.body;

        // Find waste items in the specified container
        const wasteItems = await Item.find({ containerId: undockingContainerId });

        // Count items before removing
        const itemsRemoved = wasteItems.length;

        // Remove waste items
        await Item.deleteMany({ containerId: undockingContainerId });

        for (const itemId of itemsToRemove) {
            await Log.create({
                userId: "System", // No user for automated disposal
                actionType: "disposal",
                itemId,
                details: {
                    reason: "Expired/Out of Uses"
                }
            });
        }        

        res.json({ success: true, itemsRemoved });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error completing undocking", error });
    }
});



module.exports = router;
