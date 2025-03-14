const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

// Search for an item
router.get("/search", async (req, res) => {
    try {
        const { itemId, itemName } = req.query;

        if (!itemId && !itemName) {
            return res.status(400).json({ success: false, message: "itemId or itemName is required" });
        }

        let query = {};
        if (itemId) query.itemId = itemId;
        if (itemName) query.name = itemName;

        const item = await Item.findOne(query);

        if (!item) {
            return res.json({ success: true, found: false, message: "Item not found" });
        }

        res.json({
            success: true,
            found: true,
            item
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error retrieving item", error });
    }
});

router.post("/retrieve", async (req, res) => {
    try {
        const { itemId, userId, timestamp } = req.body;

        const item = await Item.findOne({ itemId });

        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Increment usage count
        item.usageCount += 1;

        // Log retrieval action
        item.retrievalHistory.push({
            userId,
            timestamp: new Date(timestamp),
            action: "retrieve"
        });

        await item.save();

        await Log.create({
            userId,
            actionType: "retrieval",
            itemId,
            details: {
                fromContainer: item.containerId
            }
        });
        

        res.json({ success: true, message: "Item retrieved successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error retrieving item", error });
    }
});

router.post("/place", async (req, res) => {
    try {
        const { itemId, userId, timestamp, containerId, position } = req.body;

        const item = await Item.findOne({ itemId });

        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Update storage location
        item.containerId = containerId;
        item.position = position;

        // Log placement action
        item.retrievalHistory.push({
            userId,
            timestamp: new Date(timestamp),
            action: "place"
        });

        await item.save();

        await Log.create({
            userId,
            actionType: "placement",
            itemId,
            details: {
                toContainer: containerId
            }
        });        

        res.json({ success: true, message: "Item placed successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error placing item", error });
    }
});
module.exports = router;
