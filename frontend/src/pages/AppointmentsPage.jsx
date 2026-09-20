import React from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import api from '../utils/api.js';
import { alertError, alertSuccess } from '../utils/toast.js';

const today = () => dayjs().format('YYYY-MM-DD');

const emptyForm = {
  patientName: '',
  fees: '',
  doctor: null,
  appointmentDate: today()
};

const statusColors = {
  scheduled: 'primary',
  completed: 'success',
  cancelled: 'default'
};

export default function AppointmentsPage() {
  const [form, setForm] = React.useState(emptyForm);
  const [doctors, setDoctors] = React.useState([]);
  const [appointments, setAppointments] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [createdAppointment, setCreatedAppointment] = React.useState(null);
  const [dateFilter, setDateFilter] = React.useState(today());

  const loadDoctors = async () => {
    try {
      const { data } = await api.get('/doctors?active=true');
      setDoctors(data);
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to load doctors');
    }
  };

  const loadAppointments = async (date = dateFilter) => {
    try {
      setLoading(true);
      const params = date ? `?date=${date}` : '';
      const { data } = await api.get(`/appointments${params}`);
      setAppointments(data);
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDoctors();
    loadAppointments(today());
  }, []);

  const validate = () => {
    if (!form.patientName.trim()) return 'Patient name is required';
    if (form.fees === '' || Number(form.fees) < 0) return 'Valid fees are required';
    if (!form.doctor?._id) return 'Select an active doctor';
    if (!form.appointmentDate) return 'Appointment date is required';
    if (form.appointmentDate < today()) return 'Past appointments are not allowed';
    return null;
  };

  const createAppointment = async () => {
    const error = validate();
    if (error) {
      alertError(error);
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.post('/appointments', {
        patientName: form.patientName,
        fees: Number(form.fees),
        doctorId: form.doctor._id,
        appointmentDate: form.appointmentDate
      });
      setCreatedAppointment(data);
      setForm({ ...emptyForm, appointmentDate: form.appointmentDate });
      setDateFilter(data.appointmentDate);
      await loadAppointments(data.appointmentDate);
      alertSuccess(`Appointment #${data.appointmentNumber} created`);
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (appointment, status) => {
    try {
      await api.patch(`/appointments/${appointment._id}/status`, { status });
      alertSuccess('Appointment status updated');
      await loadAppointments();
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to update appointment');
    }
  };

  const formatDate = (date) => dayjs(date).format('DD MMMM YYYY');

  const buildAppointmentPrintHtml = (appointment) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Appointment Slip</title>
  <style>
    @page { size: 80mm auto; margin: 4mm 3mm; }
    @media print { html, body { width: 80mm; } }
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 8px; color: #000; text-align: center; }
    h1 { font-size: 18px; margin: 0 0 8px 0; }
    .label { font-size: 13px; font-weight: 700; text-transform: uppercase; }
    .number { font-size: 58px; line-height: 1; font-weight: 900; margin: 8px 0 12px; border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 10px; font-size: 14px; padding: 5px 0; text-align: left; border-bottom: 1px dotted #000; }
    .row b { min-width: 70px; }
    .footer { margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Irfan Medical Center</h1>
  <div class="label">Appointment Number</div>
  <div class="number">#${appointment.appointmentNumber || 'N/A'}</div>
  <div class="row"><b>Patient</b><span>${appointment.patientName || 'N/A'}</span></div>
  <div class="row"><b>Doctor</b><span>Dr. ${appointment.doctor?.name || 'N/A'}</span></div>
  <div class="row"><b>Fees</b><span>${Number(appointment.fees || 0).toFixed(2)}</span></div>
  <div class="row"><b>Date</b><span>${formatDate(appointment.appointmentDate)}</span></div>
  <div class="footer">Please keep this slip for your turn.<br/>Powered by Try Unity Solutions</div>
</body>
</html>`;

  const printAppointment = async (appointment) => {
    if (window?.electronAPI?.printAppointment) {
      const result = await window.electronAPI.printAppointment(appointment);
      if (result.success) {
        alertSuccess(result.message);
      } else {
        alertError(result.message);
      }
      return;
    }

    const win = window.open('', '_blank');
    if (!win) {
      alertError('Could not open print window. Please enable popups.');
      return;
    }
    win.document.write(buildAppointmentPrintHtml(appointment));
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Box sx={{ px: { xs: 1, md: 0 } }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Create Appointment</Typography>
              <Typography variant="body2" color="text.secondary">
                Queue numbers are generated per doctor and reset every calendar day.
              </Typography>
            </Box>
            <Chip
              label={`${appointments.length} appointments shown`}
              color="primary"
              variant="outlined"
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
            />
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Patient Name"
                value={form.patientName}
                onChange={e => setForm({ ...form, patientName: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fees"
                type="number"
                value={form.fees}
                onChange={e => setForm({ ...form, fees: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={doctors}
                value={form.doctor}
                onChange={(event, doctor) => setForm({ ...form, doctor })}
                getOptionLabel={(doctor) => doctor ? `Dr. ${doctor.name} - ${doctor.specialization}` : ''}
                renderInput={(params) => (
                  <TextField {...params} label="Select Doctor" required />
                )}
                noOptionsText="No active doctors found"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Appointment Date"
                type="date"
                value={form.appointmentDate}
                onChange={e => setForm({ ...form, appointmentDate: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: today() }}
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="contained" onClick={createAppointment} disabled={saving}>
              {saving ? 'Creating...' : 'Create Appointment'}
            </Button>
          </Stack>
        </Paper>

        {createdAppointment && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Appointment Created Successfully</Typography>
                <Typography variant="body2">
                  {createdAppointment.patientName} with Dr. {createdAppointment.doctor?.name} on {formatDate(createdAppointment.appointmentDate)}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">Appointment Number</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  #{createdAppointment.appointmentNumber}
                </Typography>
              </Box>
            </Stack>
          </Alert>
        )}

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6">Appointments</Typography>
                <Typography variant="body2" color="text.secondary">Filter by date and manage patient visit status.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="Date"
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button variant="outlined" onClick={() => loadAppointments(dateFilter)} disabled={loading}>
                  Load
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Appointment #</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Fees</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map(appointment => (
                  <TableRow key={appointment._id} hover>
                    <TableCell>
                      <Chip
                        label={`#${appointment.appointmentNumber}`}
                        color="primary"
                        sx={{ fontWeight: 800, minWidth: 56 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{appointment.patientName}</TableCell>
                    <TableCell>{Number(appointment.fees || 0).toFixed(2)}</TableCell>
                    <TableCell>Dr. {appointment.doctor?.name || 'N/A'}</TableCell>
                    <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={appointment.status}
                        color={statusColors[appointment.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => printAppointment(appointment)}>
                          Print
                        </Button>
                        <TextField
                          select
                          size="small"
                          value={appointment.status}
                          onChange={e => updateStatus(appointment, e.target.value)}
                          sx={{ minWidth: 130 }}
                        >
                          <MenuItem value="scheduled">Scheduled</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </TextField>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography sx={{ py: 3 }} color="text.secondary">No appointments found for this date.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
