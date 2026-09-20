function buildReceiptHtml(bill) {
  const itemsHtml = (bill.items || [])
    .map(
      (item) => `
        <div class="row">
          <span>${item.description || "N/A"}</span>
          <span class="amount">${item.amount ? item.amount.toFixed(2) : "0.00"}</span>
        </div>
        <div class="separator"></div>
      `
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          font-size: 13px;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
        }
        .container {
          width: 90%;
          max-width: 320px; /* good for receipt roll */
          padding: 10px;
        }
        h1 {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin: 5px 0 8px 0;
        }
        .info {
          font-size: 12px;
          margin-bottom: 10px;
        }
        .detail {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .separator {
          border-bottom: 1px dotted #000;
          margin: 2px 0 4px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 2px 0;
        }
        .amount {
          text-align: right;
          min-width: 50px;
        }
        .total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 14px;
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px dashed #000;
        }
        .status {
          font-size: 14px;
          font-weight: bold;
          color: ${bill.status === "paid" ? "green" : "red"};
          text-align: center;
          margin-top: 8px;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 12px;
          border-top: 1px dashed #aaa;
          padding-top: 6px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Irfan Medical Center</h1>

        <div class="info">
          <div class="detail"><b>Bill No</b><span>${bill.billNumber || "N/A"}</span></div>
          <div class="separator"></div>
          <div class="detail"><b>Patient</b><span>${bill.patient?.name || "Unknown"}</span></div>
          <div class="separator"></div>
          <div class="detail"><b>Date</b><span>${bill.createdAt ? new Date(bill.createdAt).toLocaleString() : new Date().toLocaleString()}</span></div>
          <div class="separator"></div>
          ${bill.doctor ? `<div class="detail"><b>Doctor</b><span>${bill.doctor}</span></div><div class="separator"></div>` : ""}
          ${bill.room ? `<div class="detail"><b>Room</b><span>${bill.room}</span></div><div class="separator"></div>` : ""}
          ${bill.technician ? `<div class="detail"><b>Technician</b><span>${bill.technician}</span></div><div class="separator"></div>` : ""}
        </div>

        ${itemsHtml}

        <div class="total">
          <span>Total</span>
          <span>${bill.totalAmount?.toFixed(2) || "0.00"}</span>
        </div>

        <div class="status">${bill.status === "paid" ? "PAID ✅" : "UNPAID ❌"}</div>

        <div class="footer">
          Powered by <b>Try Unity Solutions</b><br/>
          Email: tryunitysolutions@gmail.com | Contact: 03023476605<br/>
          Thank you for your visit – <b>Get Well Soon ❤️</b>
        </div>
      </div>
    </body>
  </html>
  `;
}

module.exports = buildReceiptHtml;
