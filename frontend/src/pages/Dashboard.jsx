import React from 'react'
import axios from 'axios'
import { Link as RouterLink } from 'react-router-dom'
import { Grid, Paper, Typography, Button, Box, Stack } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useSelector } from 'react-redux'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import dayjs from 'dayjs'

export default function Dashboard(){
  const { token } = useSelector(s=>s.auth)
  const [series, setSeries] = React.useState([])
  const [summary, setSummary] = React.useState(null)
  const [todayData, setTodayData] = React.useState(null)
  const [allTimeData, setAllTimeData] = React.useState(null)
  const [selectedDate, setSelectedDate] = React.useState(dayjs())
  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

  const loadData = async () => {
    try {
      // Load chart data based on selected date
      const monthParam = selectedDate.format('YYYY-MM')
      const { data } = await axios.get(`${API}/reports/timeseries?month=${monthParam}`, { headers: { Authorization: `Bearer ${token}` } })
      setSeries(data)

      // Load summary for selected month
      const { data: summaryData } = await axios.get(`${API}/reports/summary?month=${monthParam}`, { headers: { Authorization: `Bearer ${token}` } })
      setSummary(summaryData)

      // Load today's data
      const { data: todayResponse } = await axios.get(`${API}/reports/today`, { headers: { Authorization: `Bearer ${token}` } })
      setTodayData(todayResponse)

      // Load all-time data
      const { data: allTimeResponse } = await axios.get(`${API}/reports/alltime`, { headers: { Authorization: `Bearer ${token}` } })
      setAllTimeData(allTimeResponse)
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  React.useEffect(() => {
    if(token) loadData()
  }, [token, selectedDate])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={2}>
        {/* Today's Stats */}
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
        
        {/* All-Time Stats */}
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

      {/* Chart with Date Picker */}
      <Grid item xs={12}>
        <Paper sx={{ p:3, borderRadius: 3, height: 350 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Revenue & Dues Chart</Typography>
            <DatePicker
              label="Select Month"
              views={['year', 'month']}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing data for {selectedDate.format('MMMM YYYY')}
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#16A34A" dot={false} name="Revenue" />
              <Line type="monotone" dataKey="dues" stroke="#6366F1" dot={false} name="Dues" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={12} my={3}>
        <Paper sx={{ p:3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb:1 }}>Quick Actions</Typography>
          <Button component={RouterLink} to="/patients" sx={{ mt:1, mr:1 }} variant="contained">Patients</Button>
          <Button component={RouterLink} to="/billing" sx={{ mt:1, mr:1 }} variant="outlined">Billing</Button>
          <Button component={RouterLink} to="/reports" sx={{ mt:1, mr:1 }} variant="outlined">Reports</Button>
        </Paper>
      </Grid>

    </Grid>
    </LocalizationProvider>
  )
}


