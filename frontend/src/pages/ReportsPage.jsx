import React from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Box, Paper, Stack, Button, Typography, MenuItem, TextField, Grid } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { alertError, alertSuccess } from '../utils/toast.js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts'
import * as XLSX from 'xlsx'
import pdfMake from 'pdfmake/build/pdfmake'
import dayjs from 'dayjs'


import pdfFonts from 'pdfmake/build/vfs_fonts'
import html2canvas from 'html2canvas'
pdfMake.vfs = pdfFonts.vfs

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

export default function ReportsPage(){
  const { token } = useSelector(s=>s.auth)
  const [range, setRange] = React.useState('daily')
  const [data, setData] = React.useState(null)
  const [series, setSeries] = React.useState([])
  const [todayData, setTodayData] = React.useState(null)
  const [allTimeData, setAllTimeData] = React.useState(null)
  const [selectedDate, setSelectedDate] = React.useState(dayjs())
  const chartRef = React.useRef()

  const load = async ()=>{
    try {
      const { data } = await axios.get(`${API}/reports/summary?range=${range}`, { headers: { Authorization: `Bearer ${token}` } })
      setData(data)
    } catch (e) { alertError('Failed to load summary') }
  }

  const loadDateFilteredData = async () => {
    try {
      const monthParam = selectedDate.format('YYYY-MM')
      const { data } = await axios.get(`${API}/reports/timeseries?month=${monthParam}`, { headers: { Authorization: `Bearer ${token}` } })
      setSeries(data)
    } catch (e) { alertError('Failed to load chart data') }
  }

  const loadTodayAndAllTime = async () => {
    try {
      const { data: todayResponse } = await axios.get(`${API}/reports/today`, { headers: { Authorization: `Bearer ${token}` } })
      setTodayData(todayResponse)

      const { data: allTimeResponse } = await axios.get(`${API}/reports/alltime`, { headers: { Authorization: `Bearer ${token}` } })
      setAllTimeData(allTimeResponse)
    } catch (e) { alertError('Failed to load summary data') }
  }

  React.useEffect(()=>{ load() },[range])
  React.useEffect(()=>{ if(token) loadDateFilteredData() },[token, selectedDate])
  React.useEffect(()=>{ if(token) loadTodayAndAllTime() },[token])

  const exportExcel = ()=>{
    const ws = XLSX.utils.json_to_sheet([data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Summary')
    XLSX.writeFile(wb, `summary-${range}.xlsx`)
    alertSuccess('Excel exported')
  }

  const exportPdf = async ()=>{
    if(!data || !chartRef.current) return

    const chartImage = await html2canvas(chartRef.current, { backgroundColor: '#ffffff' })
    const imageData = chartImage.toDataURL('image/png')

    const doc = {
      content: [
        { text: 'Revenue Summary', style: 'header' },
        { text: `Range: ${range}` },
        { text: `Revenue: ${data.revenue}` },
        { text: `Dues: ${data.dues}` },
        { text: '\n' }, // Add some space
        { image: imageData, width: 500 } // Embed the chart image
      ],
      styles: { header: { fontSize: 18, bold: true } }
    }
    pdfMake.createPdf(doc).download(`summary-${range}.pdf`)
    alertSuccess('PDF exported')
  }

  const printSummary = async ()=>{
    if(!data) return
    const html = `
      <html><head><meta charset='utf-8' /><style>
      body{font-family:Roboto,Arial,sans-serif;padding:24px}
      h1{color:#2563EB}
      .row{margin:8px 0}
      </style></head><body>
      <h1>Daily Closing Summary</h1>
      <div class='row'>Range: ${range}</div>
      <div class='row'>Revenue: ${data.revenue}</div>
      <div class='row'>Dues: ${data.dues}</div>
      <div class='row'>Expenses: ${data.expenseTotal}</div>
      </body></html>`
    if (window?.electronAPI?.printHtml) {
      await window.electronAPI.printHtml(html)
    } else {
      const w = window.open('', '_blank'); w.document.write(html); w.document.close(); w.print(); w.close()
    }
    alertSuccess('Sent to printer')
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Box>
      <Paper sx={{ p:2 }}>
        <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
          <TextField select label="Range" value={range} onChange={e=>setRange(e.target.value)}>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </TextField>
          <Button onClick={load}>Refresh</Button>
          {data && <>
            <Button variant="outlined" onClick={exportExcel}>Export Excel</Button>
            <Button variant="outlined" onClick={exportPdf}>Export PDF</Button>
            <Button variant="outlined" onClick={printSummary}>Print</Button>
          </>}
        </Stack>
        
        {/* Today's and All-Time Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p:3, borderRadius: 3, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" color="text.secondary">Today's Revenue</Typography>
              <Typography variant="h4" color="primary">₨{todayData?.revenue?.toFixed(2) || '0.00'}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p:3, borderRadius: 3, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" color="text.secondary">Today's Dues</Typography>
              <Typography variant="h4" color="error">₨{todayData?.dues?.toFixed(2) || '0.00'}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p:3, borderRadius: 3, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" color="text.secondary">All-Time Revenue</Typography>
              <Typography variant="h4" color="primary">₨{allTimeData?.revenue?.toFixed(2) || '0.00'}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p:3, borderRadius: 3, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" color="text.secondary">All-Time Dues</Typography>
              <Typography variant="h4" color="error">₨{allTimeData?.dues?.toFixed(2) || '0.00'}</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {data && (
          <Grid container spacing={2} sx={{ mt:2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p:3, borderRadius: 3, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" color="text.secondary">Period Revenue ({range})</Typography>
                <Typography variant="h4" color="primary">₨{data.revenue?.toFixed(2) || '0.00'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p:3, borderRadius: 3, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" color="text.secondary">Period Dues ({range})</Typography>
                <Typography variant="h4" color="error">₨{data.dues?.toFixed(2) || '0.00'}</Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Chart with Date Picker */}
        <Box sx={{ mt:3, height: 380 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Revenue & Dues Trend</Typography>
            <DatePicker
              label="Select Month"
              views={['year', 'month']}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chart showing data for {selectedDate.format('MMMM YYYY')}
          </Typography>
          <ResponsiveContainer width="100%" height={280} ref={chartRef}>
            <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#16A34A" dot={false} name="Revenue" />
              <Line type="monotone" dataKey="dues" stroke="#6366F1" dot={false} name="Dues" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
    </LocalizationProvider>
  );
}





