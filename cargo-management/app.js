const express = require("express");
const connectDB = require("./config/mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());

connectDB();

app.use("/api", require("./routes/placement"));
app.use("/api", require("./routes/item"));
app.use("/api", require("./routes/waste"));
app.use("/api", require("./routes/simulate"));
app.use("/api", require("./routes/importExport"));
app.use("/api", require("./routes/logs"));


app.get("/", (req, res) => {
    res.send("Welcome");
})

app.listen(process.env.PORT || 8000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 8000}`);
});
