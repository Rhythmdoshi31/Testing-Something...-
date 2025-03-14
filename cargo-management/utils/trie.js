class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.itemId = null;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(itemName, itemId) {
        let node = this.root;
        for (let char of itemName.toLowerCase()) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
        node.itemId = itemId;
    }

    search(prefix) {
        let node = this.root;
        for (let char of prefix.toLowerCase()) {
            if (!node.children[char]) {
                return [];
            }
            node = node.children[char];
        }
        return this._collectAllWords(node);
    }

    _collectAllWords(node, results = []) {
        if (node.isEndOfWord) results.push(node.itemId);
        for (let char in node.children) {
            this._collectAllWords(node.children[char], results);
        }
        return results;
    }
}

module.exports = Trie;
