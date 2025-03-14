const express = require("express");
const router = express.Router();
const Item = require("../models/Item"); // Assuming item model is here

router.post("/simulate/day", async (req, res) => {
    try {
        let { numOfDays, toTimestamp, itemsToBeUsedPerDay } = req.body;

        let newDate = new Date();
        if (toTimestamp) {
            newDate = new Date(toTimestamp); // Use given timestamp
        } else if (numOfDays) {
            newDate.setDate(newDate.getDate() + numOfDays); // Move forward by days
        } else {
            return res.status(400).json({ success: false, message: "Provide numOfDays or toTimestamp" });
        }

        console.log("\n🔎 DEBUG: Simulating time up to:", newDate);

        // Initialize lists
        let itemsUsed = [];
        let itemsExpired = [];
        let itemsDepletedToday = [];

        for (const itemToUse of itemsToBeUsedPerDay) {
            const item = await Item.findOne({ itemId: itemToUse.itemId });
            if (!item) continue;

            console.log(`🔄 Updating item ${item.itemId}:`, item.usageCount, "->", item.usageCount + numOfDays);

            // Increase usage count
            item.usageCount += numOfDays;
            if (item.usageCount >= item.usageLimit) {
                itemsDepletedToday.push({ itemId: item.itemId, name: item.name });
            }

            await item.save();
            itemsUsed.push({ itemId: item.itemId, name: item.name });
        }

        // Check for expired items
        const expiredItems = await Item.find({ expiryDate: { $lt: newDate } });
        for (const item of expiredItems) {
            itemsExpired.push({ itemId: item.itemId, name: item.name });
        }

        res.json({
            success: true,
            newDate: newDate.toISOString(),
            changes: {
                itemsUsed,
                itemsExpired,
                itemsDepletedToday
            }
        });

    } catch (error) {
        console.error("🚨 DEBUG: Error in time simulation API:", error);
        res.status(500).json({ success: false, message: "Error simulating time", error });
    }
});

module.exports = router;
