const express = require("express");
const router = express.Router();
const pool = require("../db");
//Creating Bill
router.post("/createBill", async (req, res) => {
    try {
        const {
            customer_name, 
            customer_mobile_number, 
            booking_date, 
            return_date, 
            advance_amount, 
            advance_amount_paid, 
            total_amount, 
            online_offline_mode, 
            discount, 
            status, 
            items_ordered
        } = req.body;

        const gst = parseFloat(total_amount) * 0;
        const final_amount_paid = parseFloat(total_amount) + gst - parseFloat(discount) + parseFloat(advance_amount);
        const invoice_date = getTodaysDate();

        const newBill = await pool.query(
            "INSERT INTO booking_billing (customer_name, customer_mobile_number, booking_date, invoice_date, return_date, advance_amount, advance_amount_paid, total_amount, gst, final_amount_paid, online_offline_mode, discount, status, items_ordered) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *",
            [
                customer_name, 
                customer_mobile_number, 
                booking_date, 
                invoice_date, 
                return_date, 
                parseFloat(advance_amount), 
                parseFloat(advance_amount_paid), 
                parseFloat(total_amount), 
                gst, 
                final_amount_paid, 
                online_offline_mode, 
                parseFloat(discount), 
                status, 
                items_ordered
            ]
        );

        res.json(newBill.rows[0]);
    } catch (err) {
        return res.status(504).json(err);
    }
});


//Display Billed and Not Returned Bills
router.get("/displayAllBill", async (req, res) => {
    try {
        const viewBill = await pool.query("Select * from booking_billing where status='Billed'");
        res.json(viewBill);
    } catch (err) {
        return res.status(504).json(err);
    }
});
//Display a specific bill
router.get("/displayBill/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const viewoneBill = await pool.query("Select * from booking_billing WHERE bill_id = $1",[id]);
        res.json(viewoneBill.rows[0]);
    } catch (err) {
        return res.status(504).json(err);
    }
});
//Delete a bill
router.delete("/deleteBill/:id", async(req,res)=>{
    try {
        const {id} = req.params;
        const deleteBill = await pool.query("Delete from booking_billing WHERE bill_id = $1",[id]);
        res.json("Bill deleted");
    } catch (err) {
        return res.status(504).json(err);
    }
})

router.get("/items", async (req, res) => {
    try {
        const viewAllItems = await pool.query("Select * from inventory");
        res.json(viewAllItems);
    } catch (err) {
        return res.status(504).json(err);
    }
});

router.delete("/items/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM inventory WHERE item_id = $1", [id]);
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        console.error("Error deleting item:", err);
        res.status(500).json({ error: "Error deleting item" });
    }
});

router.put("/items/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { item_description, item_size, rate, item_quantity } = req.body;

        const updateItem = await pool.query(
            "UPDATE inventory SET item_description = $1, item_size = $2, rate = $3, item_quantity = $4 WHERE item_id = $5",
            [item_description, item_size, rate, item_quantity, id]
        );

        if (updateItem.rowCount === 0) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json({ message: "Item updated successfully" });
    } catch (err) {
        console.error("Error updating item:", err);
        res.status(500).json({ error: "Error updating item" });
    }
});



router.patch('/updateQuantity', async (req, res) => {
    const { item_description, quantity } = req.body;

    if (!item_description || quantity === undefined) {
        return res.status(400).json({ error: 'Item description and quantity are required' });
    }

    try {
        // Fetch the current quantity of the item from the inventory
        const currentItem = await pool.query(
            'SELECT item_quantity FROM inventory WHERE item_description = $1',
            [item_description]
        );

        if (currentItem.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in inventory' });
        }

        const currentQuantity = currentItem.rows[0].item_quantity; // Use correct column name

        // Calculate the new quantity
        const newQuantity = currentQuantity + quantity;

        if (newQuantity < 0) {
            return res.status(400).json({ error: 'Not enough stock to fulfill this request' });
        }

        // Update the inventory quantity
        const updatedItem = await pool.query(
            'UPDATE inventory SET item_quantity = $1 WHERE item_description = $2 RETURNING *',
            [newQuantity, item_description]
        );

        return res.json({ message: 'Inventory updated successfully', item: updatedItem.rows[0] });
    } catch (err) {
        console.error('Error updating inventory:', err.message);
        return res.status(500).json({ error: 'Server error updating inventory' });
    }
});




router.put("/updateBooking/:id", async (req, res) => {
    const { id } = req.params;
    const {
      customer_name,
      customer_mobile_number,
      booking_date,
      return_date,
      total_amount,
      advance_amount,
      advance_amount_paid,
      online_offline_mode,
      discount,
      status,
      comments,
      items_ordered
    } = req.body;
    const gst = parseFloat(total_amount) * 0;
    const final_amount_paid = parseFloat(total_amount) + gst - parseFloat(discount) + parseFloat(advance_amount);
    try {
      const result = await pool.query(
        `UPDATE booking_billing 
         SET customer_name = $1, 
             customer_mobile_number = $2, 
             booking_date = $3, 
             return_date = $4, 
             total_amount = $5, 
             advance_amount = $6,
             advance_amount_paid = $7,
             gst = $8,
             final_amount_paid = $9,
             online_offline_mode = $10,
             discount = $11,
             status = $12,
             items_ordered = $13,
             comments = $14
         WHERE bill_id = $15`,
        [
          customer_name,
          customer_mobile_number,
          booking_date,
          return_date,
          parseFloat(total_amount),
          parseFloat(advance_amount),
          parseFloat(advance_amount_paid),
          gst,
          final_amount_paid,
          online_offline_mode,
          parseFloat(discount),
          status,
          items_ordered,
          comments,
          id
        ]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }
  
      res.status(200).json({ message: "Booking updated successfully" });
    } catch (err) {
      console.error("Error updating booking:", err);
      res.status(500).json({ error: "An error occurred while updating the booking" });
    }
  });
  
router.post("/createBooking", async (req, res) => {
    try {
        const { customer_name, customer_mobile_number, booking_date, return_date, advance_amount, advance_amount_paid, total_amount, online_offline_mode, discount, status, items_ordered} = req.body;
        const gst = parseFloat(total_amount) * 0;
        const final_amount_paid = parseFloat(total_amount) + gst - parseFloat(discount) + parseFloat(advance_amount);
        const newBill = await pool.query(
            "INSERT INTO booking_billing (customer_name, customer_mobile_number, booking_date,  return_date, advance_amount, advance_amount_paid, total_amount, gst, final_amount_paid, online_offline_mode, discount, status,items_ordered) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
            [customer_name, customer_mobile_number, booking_date, return_date, parseFloat(advance_amount), parseFloat(advance_amount_paid), parseFloat(total_amount), gst, final_amount_paid, online_offline_mode, parseFloat(discount), status,items_ordered]
        );

        res.json(newBill.rows[0]);
    } catch (err) {
        return res.status(504).json(err);
    }
});
router.get("/getBookings", async (req, res) => {
    try {
        const viewBill = await pool.query("SELECT * FROM booking_billing WHERE status = 'Booked'");
        res.json(viewBill.rows);
    } catch (err) {
        return res.status(500).json(err);
    }
});
router.put("/getBookings/:id",async(req,res)=>{
    try {
        const {id} = req.params;
        const updateBooking = await pool.query("UPDATE booking_billing SET status = 'Billed' WHERE bill_id = $1",[id]);
        res.json("Bill Created");
    } catch (err) {
        console.log(err.message);
    }
})
router.put("/setBookings/:id",async(req,res)=>{
    try {
        const {id} = req.params;
        const invoice_date = getTodaysDate();
        const updateBooking = await pool.query("UPDATE booking_billing SET invoice_date = $1 WHERE bill_id = $2",[invoice_date,id]);
    } catch (err) {
        console.log(err.message);
    }
})

router.put("/setOrders/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Check if id is provided and is a valid number
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: "Invalid or missing bill ID" });
        }

        // Perform the update operation
        const updateResult = await pool.query(
            "UPDATE booking_billing SET status = 'Returned' WHERE bill_id = $1",
            [id]
        );

        // Check if any row was updated
        if (updateResult.rowCount === 0) {
            return res.status(404).json({ error: "No booking found with the provided bill ID" });
        }

        // Return success response
        res.status(200).json({ message: "Booking status updated successfully" });
    } catch (err) {
        console.error("Error updating booking status:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/getOrdersR", async (req, res) => {
    try {
        const viewOrders = await pool.query("SELECT * FROM booking_billing WHERE status = 'Returned'");
        res.json(viewOrders.rows);
    } catch (err) {
        return res.status(500).json(err);
    }
});
router.put("/mobileNoCorrection/:id", async(req,res) =>{
    try{
    const {id} = req.params;
    const updateMobileNumbers = await pool.query(`UPDATE booking_billing SET customer_mobile_number = '91' || 
    customer_mobile_number WHERE bill_id = $1 AND customer_mobile_number LIKE '91%'`,[id]);
    } catch (err) {
        return res.status(500).json(err);
    }
});
router.put("/messageSent/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateResult = await pool.query(
            `UPDATE booking_billing SET message_sent = 'Yes' WHERE bill_id = $1`,
            [id]
        );
        res.status(200).json({ message: 'Update successful', updateResult });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
function getTodaysDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}




router.get("/displayItems/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const viewoneArray = await pool.query("Select items_ordered from booking_billing WHERE bill_id = $1",[id]);
        res.json(viewoneArray.rows[0]);
    } catch (err) {
        return res.status(504).json(err);
    }
});
module.exports = router;
