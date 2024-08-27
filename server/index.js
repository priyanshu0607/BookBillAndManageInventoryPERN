const express = require("express");
const cors = require("cors");
const app = express();
const billRoutes = require("./routes/bill.js");
const userRoutes = require("./routes/users.js");
const itemRoutes = require("./routes/items.js");
app.use(cors({ origin: "*" }));
app.use(express.json());

/* API Routes */
app.use("/api/bill", billRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
const pool = require("./db");
app.listen(3000, () => {
    console.log("Listening at port 3000");
   
});
