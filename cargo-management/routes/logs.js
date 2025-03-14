const express = require("express");
const router = express.Router();  // ✅ This line was missing!
const Log = require("../models/Log");

// 📌 GET logs with filters
router.get("/logs", async (req, res) => {
    try {
        let { startDate, endDate, itemId, userId, actionType } = req.query;

        console.log("🚀 Received startDate:", startDate);
        console.log("🚀 Received endDate:", endDate);

        // 📌 Ensure startDate and endDate exist
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "startDate and endDate are required in ISO format." });
        }

        // 📌 Convert to Date and Validate
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        console.log("✅ Parsed startDate:", parsedStartDate);
        console.log("✅ Parsed endDate:", parsedEndDate);

        if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS.SSSZ",
                receivedStartDate: startDate,
                receivedEndDate: endDate
            });
        }

        // Adjust times for full day
        parsedStartDate.setUTCHours(0, 0, 0, 0);
        parsedEndDate.setUTCHours(23, 59, 59, 999);

        // 📌 Build filter object
        let filter = { timestamp: { $gte: parsedStartDate, $lte: parsedEndDate } };
        if (itemId) filter.itemId = itemId;
        if (userId) filter.userId = userId;
        if (actionType) filter.actionType = actionType;

        // 📌 Fetch logs
        const logs = await Log.find(filter).sort({ timestamp: -1 });

        res.json({ success: true, logs });

    } catch (error) {
        console.error("❌ Error fetching logs:", error);
        res.status(500).json({ success: false, message: "Error fetching logs", error });
    }
});

module.exports = router;  // ✅ Make sure you export the router!
