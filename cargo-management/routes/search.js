const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Trie = require("../utils/trie");

let itemTrie = new Trie();

async function loadTrie() {
    try {
        const items = await Item.find();  // Fetch all items from DB
        console.log("✅ Items Fetched from DB:", items);

        if (items.length === 0) {
            console.log("⚠️ No items found in MongoDB. Trie remains empty.");
            return;
        }

        items.forEach(item => {
            if (item.name) {
                itemTrie.insert(item.name, item.itemId);
                console.log(`✅ Inserted into Trie: ${item.name} (${item.itemId})`);
            } else {
                console.log(`⚠️ Item ${item.itemId} has no name, skipping.`);
            }
        });
    } catch (error) {
        console.error("❌ Error loading Trie:", error);
    }
}

// Load Trie AFTER MongoDB connection is established
loadTrie();

router.get("/search", (req, res) => {
    const { itemName } = req.query;
    if (!itemName) {
        return res.status(400).json({ success: false, message: "itemName is required" });
    }

    console.log(`🔍 Searching Trie for: ${itemName}`);
    const results = itemTrie.search(itemName);

    if (results.length === 0) {
        console.log("❌ No matching items found");
        return res.json({ success: true, found: false, message: "Item not found" });
    }

    console.log("✅ Found items:", results);
    res.json({ success: true, found: true, items: results });
});

module.exports = router;
