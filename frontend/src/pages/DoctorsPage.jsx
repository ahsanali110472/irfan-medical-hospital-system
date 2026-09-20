import React from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
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
import api from '../utils/api.js';
import { alertError, alertSuccess } from '../utils/toast.js';

const emptyForm = {
  name: '',
  specialization: ''
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = React.useState([]);
  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [q, setQ] = React.useState('');

  const loadDoctors = async (query = q) => {
    try {
      setLoading(true);
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      const { data } = await api.get(`/doctors${params}`);
      setDoctors(data);
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDoctors('');
  }, []);

  const validate = () => {
    if (!form.name.trim()) return 'Doctor name is required';
    if (!form.specialization.trim()) return 'Specialization is required';
    return null;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveDoctor = async () => {
    const error = validate();
    if (error) {
      alertError(error);
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/doctors/${editingId}`, form);
        alertSuccess('Doctor updated successfully');
      } else {
        await api.post('/doctors', form);
        alertSuccess('Doctor added successfully');
      }
      resetForm();
      await loadDoctors();
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const editDoctor = (doctor) => {
    setEditingId(doctor._id);
    setForm({
      name: doctor.name || '',
      specialization: doctor.specialization || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDoctor = async (doctor) => {
    if (!window.confirm(`Delete Dr. ${doctor.name}? Doctors with appointments cannot be deleted.`)) return;

    try {
      await api.delete(`/doctors/${doctor._id}`);
      alertSuccess('Doctor deleted successfully');
      await loadDoctors();
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to delete doctor');
    }
  };

  return (
    <Box sx={{ px: { xs: 1, md: 0 } }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {editingId ? 'Edit Doctor' : 'Add Doctor'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add doctors by name and specialization.
              </Typography>
            </Box>
            <Chip
              label={`${doctors.filter(d => d.isActive).length} active doctors`}
              color="primary"
              variant="outlined"
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
            />
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                label="Doctor Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                label="Specialization"
                value={form.specialization}
                onChange={e => setForm({ ...form, specialization: e.target.value })}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            {editingId && (
              <Button variant="outlined" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button variant="contained" onClick={saveDoctor} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Doctor' : 'Add Doctor'}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6">Doctors</Typography>
                <Typography variant="body2" color="text.secondary">Doctor list used by the appointment form.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="Search"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
                <Button variant="outlined" onClick={() => loadDoctors(q)} disabled={loading}>
                  Search
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map(doctor => (
                  <TableRow key={doctor._id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>Dr. {doctor.name}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => editDoctor(doctor)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => deleteDoctor(doctor)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && doctors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography sx={{ py: 3 }} color="text.secondary">No doctors found.</Typography>
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
