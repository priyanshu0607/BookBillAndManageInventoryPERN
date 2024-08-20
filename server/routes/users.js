const express = require("express");
const router = express.Router();
const pool = require("../db");
router.get("/getUsers", async (req, res) => {
    try {
        const getUsers = await pool.query("SELECT * FROM users");
        res.json(getUsers.rows); // Assuming you are using pg library, getUsers.rows will contain the result set
    } catch (err) {
        console.error(err.message); // Log the error message for debugging
        res.status(500).json({ error: err.message });
    }
});
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, message: "Login successful!" });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    } catch (err) {
        console.error(err.message); // Log the error message for debugging
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
