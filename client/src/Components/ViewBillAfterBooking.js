import React, { Fragment, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./ViewBill.css"; // Import the CSS file
import logo from "../logo.jpg";

const ViewBillAfterBooking = () => {
  const { bookingId } = useParams(); // Extract bookingId from URL
  const [bill, setBill] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsOrdered, setItemsOrdered] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getBill = async () => {
      try {
        const billResponse = await fetch(`http://localhost:3000/api/bill/displayBill/${bookingId}`);
        const jsonData = await billResponse.json();
        setBill(jsonData);
        setItemsOrdered(parseItemsOrdered(jsonData.items_ordered));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching or parsing data:", err);
      }
    };

    getBill();
  }, [bookingId]);
  const parseItemsOrdered = (itemsArray) => {
    if (!itemsArray || !Array.isArray(itemsArray)) {
      console.error("Invalid items array:", itemsArray);
      return [];
    }

    return itemsArray.map(itemStr => {
      const itemParts = itemStr.match(/item_description:\s*([^,]+)\s*item_size:\s*(\d+)\s*quantity:\s*(\d+)\s*rate:\s*(\d+\.?\d*)/);
      if (!itemParts) {
        console.error("Invalid item string format:", itemStr);
        return null;
      }

      const item_description = itemParts[1].trim();
      const item_size = parseInt(itemParts[2].trim(), 10);
      const quantity = parseInt(itemParts[3].trim(), 10);
      const rate = parseFloat(itemParts[4].trim());
      const rateOfOne = rate/quantity;
      const totalrate = quantity * rateOfOne;

      return { item_description, item_size, quantity, rateOfOne, totalrate };
    }).filter(item => item !== null);
  };
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", options).replace(/\//g, "-");
  };

  const generatePDF = async () => {
    if (!bill) {
      console.error("Bill data not loaded.");
      return;
    }

    try {
      const input = document.querySelector('.bill');

      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a5',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = ((canvas.height * pdfWidth) / canvas.width);

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Save PDF to a file
        pdf.save(`Bill_${bill.customer_name}.pdf`);

        // Open WhatsApp with pre-filled message
        openWhatsApp();
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const openWhatsApp = async () => {
    if (!bill) {
      console.error("Bill data not loaded.");
      return;
    }

    let customerMobileNumber = bill.customer_mobile_number;
    if (!customerMobileNumber.startsWith("+")) {
      customerMobileNumber = `+91${customerMobileNumber}`;
    }

    const message = `Bill Details for ${bill.customer_name}. Download PDF: [Insert Link Here]`;
    const whatsappUrl = `https://wa.me/${customerMobileNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    try {
      const response = await fetch(`http://localhost:3000/api/messageSent/${bill.bill_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to update message_sent status with status ${response.status}`);
      }

      console.log("Message sent status updated successfully");

    } catch (error) {
      console.error("Error updating message_sent status:", error);
    }
  };

  const printBill = () => {
    window.print();
  };
  
  return (
    <Fragment>
      <div className="bill_container" id="bill-details">
        {bill ? (
          <div className="bill">
            <div className="bill-header">
            <img src={logo} alt="Logo" className="logo" />
            
              <div className="header-content">
                <h1 className="store-name">BABU'S KREATIONZ</h1>
                <p className="store-address">Opp Andhra Bank, Bettadasanapura Main Road, Above TVS Showroom, Bengaluru - 560106</p>
                <p className="store-contact">Mob: +91 9242523210</p>
              </div>
            </div>
            <h2 className="bill-title">Bill Details</h2>
            <div className="bill-details">
              <div className="bill-detail-row">
                <p><span>ID:</span> {bill.bill_id}</p>
              </div>
              <div className="bill-detail-row">
                <p><span>Name:</span> {bill.customer_name}</p>
                <p><span>Mobile Number:</span> {bill.customer_mobile_number}</p>
                <p><span>Invoice Date:</span> {formatDate(bill.invoice_date)}</p>
              </div>
              <div className="bill-detail-row">
                <p><span>Booking Date:</span> {formatDate(bill.booking_date)}</p>
                <p><span>Return Date:</span> {formatDate(bill.return_date)}</p>
                <p><span>Advance Amount Paid:</span> {bill.advance_amount_paid}</p>
              </div>
              <div className="bill-detail-row items-container">
                <div className="items-table-container">
                  <p><span>Items Ordered:</span></p>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Size</th>
                        <th>Rate</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                    {itemsOrdered.map((item, index) => (
                      <tr key={index}>
                        <td>{item.item_description}</td>
                        <td>{item.item_size}</td>
                        <td>{item.rateOfOne}</td>
                        <td>{item.quantity}</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="summary-container">
                <p><span>Online/Offline Mode:</span> {bill.online_offline_mode}</p>
                <p><span>CGST:</span> {bill.gst / 2}</p>
                <p><span>SGST:</span> {bill.gst / 2}</p>
                <p><span>Discount:</span> {bill.discount}</p>
                <p><span>Total Amount:</span> {bill.total_amount}</p>
              </div>
            </div>
            <div className="bill-total">
              Final Amount: {bill.final_amount_paid}
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <div className="button-container">
        <button onClick={generatePDF} className="pdf-download-button">Download PDF and Share it on Whatsapp</button>
        <button onClick={printBill} className="print-button">Print</button>
        <button onClick={() => navigate('/')} className="back-home-button">Back to Homepage</button>
      </div>
    </Fragment>
  );
};


export default ViewBillAfterBooking;
