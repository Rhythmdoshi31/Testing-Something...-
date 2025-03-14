const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
    itemId: String,
    name: String,
    containerId: String,  // Where the item is stored
    zone: String,
    width: Number,
    depth: Number,
    height: Number,
    position: {
        startCoordinates: {
            width: Number,
            depth: Number,
            height: Number
        },
        endCoordinates: {
            width: Number,
            depth: Number,
            height: Number
        }
    },
    usageCount: { type: Number, default: 0 },  // Track how many times it has been used
    usageLimit: { type: Number, required: true },  // Max allowed usage before disposal
    expiryDate: { type: Date, required: true },  // When the item expires
    retrievalHistory: [
        {
            userId: String,
            timestamp: Date,
            action: String // "retrieve" or "place"
        }
    ]
});

module.exports = mongoose.model("Item", ItemSchema);
