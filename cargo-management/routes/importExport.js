const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const Item = require("../models/Item");
const Container = require("../models/Container");
const router = express.Router();

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// 📌 Import Items from CSV
router.post("/import/items", upload.single("file"), async (req, res) => {
    const results = [];
    const errors = [];
    let rowCount = 0;

    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (data) => {
            rowCount++;
            try {
                results.push({
                    itemId: data["Item ID"],
                    name: data["Name"],
                    containerId: data["Container ID"],
                    zone: data["Zone"],
                    usageCount: parseInt(data["Usage Count"]),
                    usageLimit: parseInt(data["Usage Limit"]),
                    expiryDate: new Date(data["Expiry Date"])
                });
            } catch (err) {
                errors.push({ row: rowCount, message: "Invalid data format" });
            }
        })
        .on("end", async () => {
            try {
                await Item.insertMany(results);
                fs.unlinkSync(req.file.path); // Remove uploaded file
                res.json({ success: true, itemsImported: results.length, errors });
            } catch (err) {
                res.status(500).json({ success: false, message: "Error importing items", error: err });
            }
        });
});

// 📌 Import Containers from CSV
router.post("/import/containers", upload.single("file"), async (req, res) => {
    const results = [];
    const errors = [];
    let rowCount = 0;

    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (data) => {
            rowCount++;
            try {
                results.push({
                    containerId: data["Container ID"],
                    zone: data["Zone"],
                    width: parseInt(data["Width"]),
                    depth: parseInt(data["Depth"]),
                    height: parseInt(data["Height"])
                });
            } catch (err) {
                errors.push({ row: rowCount, message: "Invalid data format" });
            }
        })
        .on("end", async () => {
            try {
                await Container.insertMany(results);
                fs.unlinkSync(req.file.path);
                res.json({ success: true, containersImported: results.length, errors });
            } catch (err) {
                res.status(500).json({ success: false, message: "Error importing containers", error: err });
            }
        });
});

const fastCsv = require("fast-csv");

// 📌 Export current arrangement as CSV
router.get("/export/arrangement", async (req, res) => {
    try {
        const items = await Item.find();

        res.setHeader("Content-Disposition", "attachment; filename=arrangement.csv");
        res.setHeader("Content-Type", "text/csv");

        const csvStream = fastCsv.format({ headers: true });

        csvStream.pipe(res);
        items.forEach(item => {
            // Use default values if position is missing
            const start = item.position?.startCoordinates || { width: 0, depth: 0, height: 0 };
            const end = item.position?.endCoordinates || { width: 1, depth: 1, height: 1 };

            csvStream.write({
                "Item ID": item.itemId,
                "Container ID": item.containerId,
                "Coordinates": `(${start.width},${start.depth},${start.height}),
                (${end.width},${end.depth},${end.height})`
            });
        });
        csvStream.end();
    } catch (error) {
        res.status(500).json({ success: false, message: "Error exporting arrangement", error });
    }
});

module.exports = router;