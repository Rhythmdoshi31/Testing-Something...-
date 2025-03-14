const mongoose = require("mongoose");

const ContainerSchema = new mongoose.Schema({
    containerId: String,
    zone: String,
    width: Number,
    depth: Number,
    height: Number
});

module.exports = mongoose.model("Container", ContainerSchema);
