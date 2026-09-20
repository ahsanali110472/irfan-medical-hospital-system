import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatients, fetchPatientsForBilling } from '../store/slices/patientSlice.js';
import { fetchBills, createBill, payBill, confirmDeleteBill } from '../store/slices/billSlice.js';
import {
  Box, Paper, Stack, TextField, Button, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { alertSuccess, alertError } from '../utils/toast.js';
import Modal from '@mui/material/Modal';
import dayjs from 'dayjs';
import axios from 'axios';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  maxHeight: '90vh',
};

export default function BillingPage() {
  const dispatch = useDispatch();
  const { billingList: patients } = useSelector(s => s.patients);
  const { token } = useSelector(s => s.auth);
  const [bills, setBills] = React.useState([]);
  const [patientId, setPatientId] = React.useState('');
  const [selectedPatient, setSelectedPatient] = React.useState(null);
  const [billSearchQuery, setBillSearchQuery] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [dateFilterType, setDateFilterType] = React.useState('all');
  const [openPreviewModal, setOpenPreviewModal] = React.useState(false);
  const [selectedBill, setSelectedBill] = React.useState(null);
  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  const loadBills = async () => {
    try {
      let url = `${API}/bills`;
      const params = new URLSearchParams();
      
      if (selectedDate && dateFilterType !== 'all') {
        if (dateFilterType === 'day') {
          params.append('date', selectedDate.format('YYYY-MM-DD'));
        } else if (dateFilterType === 'month') {
          params.append('month', selectedDate.format('YYYY-MM'));
        } else if (dateFilterType === 'year') {
          params.append('year', selectedDate.format('YYYY'));
        }
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setBills(data);
    } catch (error) {
      console.error('Failed to load bills:', error);
      alertError('Failed to load bills');
    }
  };

  React.useEffect(() => {
    dispatch(fetchPatientsForBilling());
    if (token) loadBills();
  }, [dispatch, token, selectedDate, dateFilterType]);

  const onCreate = async () => {
    if (!patientId) return;
    const res = await dispatch(createBill({ patientId }));
    if (res.meta.requestStatus === 'fulfilled') {
      alertSuccess('Bill generated');
      setSelectedPatient(null);
      setPatientId('');
      dispatch(fetchPatientsForBilling()); // Refresh the list
      loadBills(); // Refresh bills list
    } else {
      alertError('Failed to generate bill');
    }
  };

  // Filter bills based on search query
  const filteredBills = bills.filter(bill => {
    if (!billSearchQuery) return true;
    const query = billSearchQuery.toLowerCase();
    const patientName = bill.patient?.name?.toLowerCase() || '';
    const patientContact = bill.patient?.contact?.toLowerCase() || '';
    return patientName.includes(query) || patientContact.includes(query);
  });

  const handleOpenPreview = (bill) => {
    setSelectedBill(bill);
    setOpenPreviewModal(true);
  };

  const handleClosePreview = () => {
    setOpenPreviewModal(false);
    setSelectedBill(null);
  };

  const printBillRow = async (bill) => {
    console.log('Attempting to print bill:', bill._id);

    if (window?.electronAPI?.printReceipt) {
      console.log('Using Electron API for printing');
      try {
        const result = await window.electronAPI.printReceipt(bill);

        if (result.success) {
          alertSuccess(result.message);
        } else {
          alertError(result.message);
        }
      } catch (error) {
        console.error('Print error:', error);
        alertError(`Print failed: ${error.message}`);
      }
    } else {
      console.log('Electron API not available, falling back to browser print');
      const html = buildReceiptHtmlForBrowser(bill);
      const win = window.open('', '_blank');
      if (!win) {
        alertError('Could not open print window. Please enable popups.');
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  // Text preview
  const buildReceiptText = (bill) => {
    const items = bill.items || [];
    const totalAmount = parseFloat(bill.totalAmount) || 0;
    const patientName = bill.patient?.name || 'Unknown Patient';
    const billNumber = bill.billNumber || 'N/A';
    const createdAt = new Date(bill.createdAt).toLocaleString();

    let receipt = '';
    receipt += 'IRFAN MEDICAL CENTER\n';
    receipt += '------------------------\n';
    receipt += `Bill #: ${billNumber}\n`;
    receipt += `Date: ${createdAt}\n`;
    receipt += `Patient: ${patientName}\n`;
    receipt += '------------------------\n\n';

    items.forEach(item => {
      const description = item.description || 'Unknown';
      const amount = parseFloat(item.amount) || 0;
      const category = item.category || '';
      receipt += `${description} (${category})\n`;
      receipt += `Rs. ${amount.toFixed(2)}\n\n`;
    });

    receipt += '------------------------\n';
    receipt += `TOTAL: Rs. ${totalAmount.toFixed(2)}\n`;
    receipt += '------------------------\n';
    receipt += 'Thank you for your visit!\n';

    return receipt;
  };

//   // ✅ Browser fallback: FIXED (use description + amount instead of name + rate)
//   const buildReceiptHtmlForBrowser = (bill) => {
//     const esc = (s = '') =>
//       String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
//     const items = bill.items || [];
//     const rows = items.map(it => `
//       <tr>
//         <td>${esc(it.description || 'Unknown')}</td>
//         <td>${Number(it.amount || 0).toFixed(2)}</td>
//       </tr>
//     `).join('');
//     const total = Number(bill.totalAmount || 0).toFixed(2);
//     const createdAt = bill.createdAt ? new Date(bill.createdAt).toLocaleString() : new Date().toLocaleString();

//     return `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8"/>
//   <title>Receipt</title>
//   <style>
//     @page { size: 80mm auto; margin: 4mm 3mm; }
//     @media print { html, body { width: 80mm; } }

//     body {
//       font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
//       font-size: 13px;
//       margin: 0;
//       padding: 10px;
//       color: #000;
//     }
//     h1 {
//       font-size: 20px;
//       font-weight: bold;
//       text-align: center;
//       margin-bottom: 10px;
//     }
//     .info {
//       margin-bottom: 10px;
//       font-size: 13px;
//     }
//     table {
//       width: 100%;
//       border-collapse: collapse;
//       margin-bottom: 10px;
//     }
//     th, td {
//       border-bottom: 1px solid #ddd;
//       padding: 6px;
//       text-align: left;
//       font-size: 13px;
//     }
//     tfoot td {
//       font-weight: bold;
//       font-size: 14px;
//     }
//     .status {
//       margin-top: 12px;
//       font-size: 16px;
//       font-weight: bold;
//       text-align: center;
//       color: green;
//     }
//     .footer {
//       margin-top: 15px;
//       text-align: center;
//       font-size: 13px;
//       border-top: 1px dashed #aaa;
//       padding-top: 8px;
//       line-height: 1.4;
//     }
//   </style>
// </head>
// <body>
//   <h1>Irfan Medical Center</h1>
//   <div class="info">
//     <p><b>Bill ID:</b> ${esc(bill._id || "N/A")}</p>
//     <p><b>Date:</b> ${esc(createdAt)}</p>
//     <p><b>Patient:</b> ${esc(bill.patient?.name || "N/A")}</p>
//   </div>

//   <table>
//     <thead>
//       <tr>
//         <th>Service</th>
//         <th>Rate</th>
//       </tr>
//     </thead>
//     <tbody>
//       ${rows}
//     </tbody>
//     <tfoot>
//       <tr>
//         <td>Total</td>
//         <td>${total}</td>
//       </tr>
//     </tfoot>
//   </table>

//   <div class="status">${bill.status === "paid" ? "PAID ✅" : "UNPAID ❌"}</div>

//   <div class="footer">
//     Powered by <b>Try Unity Solutions</b><br/>
//     Email: tryunitysolutions@gmail.com | Contact: 03023476605<br/>
//     Thank you for your visit – <b>Get Well Soon ❤️</b>
//   </div>
// </body>
// </html>`;
//   };
// ✅ Browser fallback: Receipt-style (no borders, centered, dashed separators)
// ✅ Browser fallback: Receipt-style (full dotted line under each detail)
const buildReceiptHtmlForBrowser = (bill) => {
  const esc = (s = '') =>
    String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const items = bill.items || [];
  const rows = items.map(it => `
    <div class="row">
      <span>${esc(it.description || 'Unknown')}</span>
      <span class="amount">${Number(it.amount || 0).toFixed(2)}</span>
    </div>
  `).join('');

  const total = Number(bill.totalAmount || 0).toFixed(2);
  const createdAt = bill.createdAt
    ? new Date(bill.createdAt).toLocaleString()
    : new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt</title>
  <style>
    @page { size: 80mm auto; margin: 4mm 3mm; }
    @media print { html, body { width: 80mm; } }

    body {
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      font-size: 13px;
      margin: 0;
      padding: 8px;
      color: #000;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 320px;
    }
    h1 {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 0 0 6px 0;
    }
    .info {
      margin-bottom: 8px;
      font-size: 12px;
      line-height: 1.4;
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
      padding: 2px 0;
      font-size: 13px;
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
      margin-top: 8px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      color: ${bill.status === "paid" ? "green" : "red"};
    }
    .footer {
      margin-top: 10px;
      text-align: center;
      font-size: 11px;
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
      <div class="detail"><span>Bill No</span><span>${esc(bill.billNumber || bill._id || "N/A")}</span></div>
      <div class="separator"></div>
      <div class="detail"><span>Patient</span><span>${esc(bill.patient?.name || "N/A")}</span></div>
      <div class="separator"></div>
      <div class="detail"><span>Date</span><span>${esc(createdAt)}</span></div>
      <div class="separator"></div>
      ${bill.doctor ? `<div class="detail"><span>Doctor</span><span>${esc(bill.doctor)}</span></div><div class="separator"></div>` : ""}
      ${bill.room ? `<div class="detail"><span>Room</span><span>${esc(bill.room)}</span></div><div class="separator"></div>` : ""}
      ${bill.technician ? `<div class="detail"><span>Technician</span><span>${esc(bill.technician)}</span></div><div class="separator"></div>` : ""}
    </div>

    ${rows}

    <div class="total">
      <span>Total</span>
      <span>${total}</span>
    </div>

    <div class="status">
      ${bill.status === "paid" ? "PAID ✅" : "UNPAID ❌"}
    </div>

    <div class="footer">
      Powered by <b>Try Unity Solutions</b><br/>
      Email: tryunitysolutions@gmail.com | Contact: 03023476605<br/>
      Thank you for your visit – <b>Get Well Soon ❤️</b>
    </div>
  </div>
</body>
</html>`;
};


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 2, mb: 2, width: '100%' }}>
            <Typography variant="subtitle1">Create Bill from Patient</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.name} - ${option.contact || 'No contact'}`}
                value={selectedPatient}
                onChange={(event, newValue) => {
                  setSelectedPatient(newValue);
                  setPatientId(newValue ? newValue._id : '');
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Search Patient" 
                    placeholder="Type patient name or contact..." 
                  />
                )}
                noOptionsText="No patients available for billing"
                fullWidth
              />
              <Button 
                variant="contained" 
                onClick={onCreate}
                disabled={!patientId}
              >
                Generate Bill
              </Button>
            </Stack>
          </Paper>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Bills</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Search Bills"
                placeholder="Search by patient name or phone number..."
                value={billSearchQuery}
                onChange={(e) => setBillSearchQuery(e.target.value)}
                size="small"
                sx={{ width: 300 }}
              />
              <TextField
                select
                label="Filter Type"
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              >
                <MenuItem value="all">All Bills</MenuItem>
                <MenuItem value="day">By Day</MenuItem>
                <MenuItem value="month">By Month</MenuItem>
                <MenuItem value="year">By Year</MenuItem>
              </TextField>
              {dateFilterType !== 'all' && (
                <DatePicker
                  label={`Select ${dateFilterType.charAt(0).toUpperCase() + dateFilterType.slice(1)}`}
                  views={dateFilterType === 'day' ? ['year', 'month', 'day'] : 
                         dateFilterType === 'month' ? ['year', 'month'] : ['year']}
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              )}
              {selectedDate && dateFilterType !== 'all' && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    setSelectedDate(null);
                    setDateFilterType('all');
                  }}
                >
                  Clear Filter
                </Button>
              )}
            </Stack>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bill #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Total (PKR)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBills.map(b => (
                <TableRow key={b._id}>
                  <TableCell>{b.billNumber}</TableCell>
                  <TableCell>{b.patient?.name || 'N/A'}</TableCell>
                  <TableCell>{b.patient?.contact || 'N/A'}</TableCell>
                  <TableCell>₨{Number(b.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>{b.status}</TableCell>
                  <TableCell>
                    {b.status === 'unpaid' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          const res = await dispatch(payBill(b._id));
                          if (res.meta.requestStatus === 'fulfilled') {
                            alertSuccess('Payment recorded');
                            await printBillRow(res.payload);
                            loadBills(); // Refresh bills list
                          } else {
                            alertError('Failed to mark paid');
                          }
                        }}
                      >
                        Mark Paid
                      </Button>
                    )}
                    <Button size="small" onClick={() => handleOpenPreview(b)}>
                      View Details
                    </Button>
                    {b.status === 'paid' && (
                      <Button size="small" sx={{ ml: 1 }} onClick={() => printBillRow(b)}>
                        Print
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                      onClick={async () => {
                        await dispatch(confirmDeleteBill(b._id));
                        loadBills(); // Refresh bills list
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
        </Stack>
      </Box>

      <Modal open={openPreviewModal} onClose={handleClosePreview}>
        <Box sx={style}>
          {selectedBill && <pre>{buildReceiptText(selectedBill)}</pre>}
          <Button onClick={handleClosePreview} sx={{ mt: 2 }}>Close</Button>
        </Box>
      </Modal>
    </LocalizationProvider>
  );
}
