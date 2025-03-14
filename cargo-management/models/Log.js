const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true, default: Date.now },
    userId: { type: String, required: true },
    actionType: { type: String, required: true, enum: ["placement", "retrieval", "rearrangement", "disposal"] },
    itemId: { type: String, required: true },
    details: {
        fromContainer: { type: String, default: null },
        toContainer: { type: String, default: null },
        reason: { type: String, default: null }
    }
});

module.exports = mongoose.model("Log", logSchema);
