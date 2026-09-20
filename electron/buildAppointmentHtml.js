function buildAppointmentHtml(appointment) {
  const createdAt = appointment.createdAt
    ? new Date(appointment.createdAt).toLocaleString()
    : new Date().toLocaleString();

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          color: #000;
          display: flex;
          justify-content: center;
        }
        .container {
          width: 90%;
          max-width: 320px;
          padding: 10px;
          text-align: center;
        }
        h1 {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 8px 0;
        }
        .label {
          font-size: 13px;
          font-weight: bold;
          margin-top: 8px;
          text-transform: uppercase;
        }
        .number {
          font-size: 58px;
          line-height: 1;
          font-weight: 900;
          margin: 8px 0 12px 0;
          border-top: 2px dashed #000;
          border-bottom: 2px dashed #000;
          padding: 8px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 14px;
          padding: 5px 0;
          text-align: left;
          border-bottom: 1px dotted #000;
        }
        .row b {
          min-width: 70px;
        }
        .footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #000;
          font-size: 12px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Irfan Medical Center</h1>
        <div class="label">Appointment Number</div>
        <div class="number">#${appointment.appointmentNumber || "N/A"}</div>
        <div class="row"><b>Patient</b><span>${appointment.patientName || "N/A"}</span></div>
        <div class="row"><b>Doctor</b><span>Dr. ${appointment.doctor?.name || "N/A"}</span></div>
        <div class="row"><b>Fees</b><span>${Number(appointment.fees || 0).toFixed(2)}</span></div>
        <div class="row"><b>Date</b><span>${appointment.appointmentDate || "N/A"}</span></div>
        <div class="footer">
          Please keep this slip for your turn.<br/>
          Powered by Try Unity Solutions
        </div>
      </div>
    </body>
  </html>
  `;
}

module.exports = buildAppointmentHtml;
