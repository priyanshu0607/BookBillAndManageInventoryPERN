const express = require("express");
const router = express.Router();
const pool = require("../db");


router.post("/insertItems", async (req, res) => {
    try {
        const {bill_id, item_description, item_size, rate, quantity ,status} = req.body;

        const newItem = await pool.query(
            "INSERT INTO ordered_items (bill_id, item_description, item_size, rate, quantity_ordered,status) VALUES ($1, $2, $3, $4, $5,$6) RETURNING *",
            [bill_id, item_description, item_size, rate, quantity,status]
        );

        res.json(newItem.rows[0]);
    } catch (err) {
        console.error("Error inserting item:", err);
        return res.status(504).json(err);
    }
});

router.get("/getItems/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const items = await pool.query(
            "SELECT item_description, item_size, rate, quantity_ordered FROM ordered_items WHERE bill_id = $1",
            [id]
        );

        res.json(items.rows);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: "Error fetching items" });
    }
});

router.put("/setItems/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateitems = await pool.query(`UPDATE ordered_items SET status = 'Billed' where bill_id=$1`,[id]);
    } catch (err) {
        console.error("Error updating booking:", err);
    }
})
router.put("/setItemsR/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateitems = await pool.query(`UPDATE ordered_items SET status = 'Returned' where bill_id=$1`,[id]);
    } catch (err) {
        console.error("Error updating booking:", err);
    }
})

router.post('/AddInventory', async (req, res) => {
    const { items } = req.body;

    if (items && Array.isArray(items)) {
        const query =
            `INSERT INTO inventory (item_type,item_description,item_size,item_quantity,rate)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;`;
        
        try {
            const insertPromises = items.map(item =>
                pool.query(query, [
                    item.item_type,
                    item.item_description,
                    item.item_size,
                    item.item_quantity,
                    item.rate
                ])
            );
            const newItems = await Promise.all(insertPromises);
            res.json(newItems.map(result => result.rows[0]));
        } catch (err) {
            console.error('Error inserting items:', err);
            return res.status(504).json(err);
        }
    } else {
        const { item_type, item_description, item_size, rate, item_quantity } = req.body;

        try {
            const newItem = await pool.query(
                "INSERT INTO inventory (item_type,item_description,item_size,item_quantity,rate) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [item_type, item_description, item_size, item_quantity,rate]
            );
            res.json(newItem.rows[0]);
        } catch (err) {
            console.error('Error inserting item:', err);
            return res.status(504).json(err);
        }
    }
});

module.exports = router;
