import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatients, createPatient, updatePatient, deletePatient } from '../store/slices/patientSlice.js';
import { Box, Paper, Stack, TextField, Button, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Chip, Grid, Modal, Autocomplete, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alertSuccess, alertError } from '../utils/toast.js';
import axios from 'axios';

export default function PatientsPage() {
  const dispatch = useDispatch();
  const { list: patients, loading } = useSelector(s => s.patients);
  const { token } = useSelector(s => s.auth);
  const [q, setQ] = React.useState('');
  const [tests, setTests] = React.useState([]);
  const [agents, setAgents] = React.useState([]);
  const [editingPatient, setEditingPatient] = React.useState(null);
  const [isEditModalOpen, setEditModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    age: '',
    gender: 'male',
    contact: '',
    cnic: '',
    address: '',
    agentName: '',
    totalAmountReceived: '',
    doctorName: '',
    doctorFee: '',
    otTechnicianName: '',
    otTechnicianFee: '',
    anesthesiaDoctorName: '',
    anesthesiaDoctorFee: '',
    selectedTests: [],
    roomName: '',
    roomFeatures: '',
    roomFee: ''
  });

  const xrayTests = tests.filter(t => t.type === 'xray');
  const ultrasoundTests = tests.filter(t => t.type === 'ultrasound');
  const otherTests = tests.filter(t => t.type === 'test');

  React.useEffect(() => { 
    dispatch(fetchPatients());
    loadTests();
    loadAgents();
  }, []);

  const loadTests = async () => {
    try {
      const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const { data } = await axios.get(`${API}/rooms`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTests(data.filter(r => ['xray','ultrasound','test'].includes(r.type)));
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const { data } = await axios.get(`${API}/agents`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

 const onAdd = async () => {
    if (!form.name || !form.age) {
      alertError('Name and Age are required');
      return;
    }
    
    const patientData = {
      name: form.name,
      age: Number(form.age),
      gender: form.gender,
      contact: form.contact,
      cnic: form.cnic,
      address: form.address,
      agentName: form.agentName,
      totalAmountReceived: form.totalAmountReceived ? Number(form.totalAmountReceived) : 0,
      currentBalance: form.totalAmountReceived ? Number(form.totalAmountReceived) : 0,
      assignedProviders: {
        doctorName: form.doctorName,
        doctorFee: form.doctorFee ? Number(form.doctorFee) : undefined,
        otTechnicianName: form.otTechnicianName,
        otTechnicianFee: form.otTechnicianFee ? Number(form.otTechnicianFee) : undefined,
        anesthesiaDoctorName: form.anesthesiaDoctorName,
        anesthesiaDoctorFee: form.anesthesiaDoctorFee ? Number(form.anesthesiaDoctorFee) : undefined
      },
      visit: {
        testIds: form.selectedTests,
        roomName: form.roomName,
        roomFeatures: form.roomFeatures,
        roomFee: form.roomFee
      }
    };

    const res = await dispatch(createPatient(patientData));
    if (res.meta.requestStatus === 'fulfilled') {
      alertSuccess('Patient added successfully');
      setForm({
        name: '', age: '', gender: 'male', contact: '', cnic: '', address: '',
        agentName: '', totalAmountReceived: '',
        doctorName: '', doctorFee: '',
        otTechnicianName: '', otTechnicianFee: '',
        anesthesiaDoctorName: '', anesthesiaDoctorFee: '',
        selectedTests: [],
        roomName: '',
        roomFeatures: '',
        roomFee: ''
      });
    } else {
      alertError('Failed to add patient');
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      const res = await dispatch(deletePatient(id));
      if (res.meta.requestStatus === 'fulfilled') {
        alertSuccess('Patient deleted successfully');
      } else {
        alertError('Failed to delete patient. They may have associated bills.');
      }
    }
  };

  const handleUpdate = async () => {
    const res = await dispatch(updatePatient(editingPatient));
    if (res.meta.requestStatus === 'fulfilled') {
      alertSuccess('Patient updated successfully');
      setEditModalOpen(false);
      setEditingPatient(null);
    } else {
      alertError('Failed to update patient');
    }
  };

  return (
    <Box>
      {/* Add Patient Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Add New Patient</Typography>
        
        {/* Basic Information */}
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Basic Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Full Name"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Age"
              type="number"
              value={form.age}
              onChange={e => setForm({...form, age: e.target.value})}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              select
              label="Gender"
              value={form.gender}
              onChange={e => setForm({...form, gender: e.target.value})}
              fullWidth
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Contact Number"
              value={form.contact}
              onChange={e => setForm({...form, contact: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="CNIC"
              value={form.cnic}
              onChange={e => setForm({...form, cnic: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Address"
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={agents}
              getOptionLabel={(option) => option.name}
              value={agents.find(agent => agent.name === form.agentName) || null}
              onChange={(event, newValue) => {
                setForm({...form, agentName: newValue ? newValue.name : ''});
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Agent" placeholder="Choose an agent..." />
              )}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Total Amount Received (PKR)"
              type="number"
              value={form.totalAmountReceived}
              onChange={e => setForm({...form, totalAmountReceived: e.target.value})}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Visit Details */}
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Visit Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Room Name"
              value={form.roomName}
              onChange={e => setForm({...form, roomName: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Room Features (comma separated)"
              value={form.roomFeatures}
              onChange={e => setForm({...form, roomFeatures: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Room Fee (PKR)"
              type="number"
              value={form.roomFee}
              onChange={e => setForm({...form, roomFee: e.target.value})}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Service Providers */}
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Service Providers</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Doctor Name"
              value={form.doctorName}
              onChange={e => setForm({...form, doctorName: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Doctor Fee (PKR)"
              type="number"
              value={form.doctorFee}
              onChange={e => setForm({...form, doctorFee: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="OT Technician"
              value={form.otTechnicianName}
              onChange={e => setForm({...form, otTechnicianName: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="OT Fee (PKR)"
              type="number"
              value={form.otTechnicianFee}
              onChange={e => setForm({...form, otTechnicianFee: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Anesthesia Doctor"
              value={form.anesthesiaDoctorName}
              onChange={e => setForm({...form, anesthesiaDoctorName: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Anesthesia Fee (PKR)"
              type="number"
              value={form.anesthesiaDoctorFee}
              onChange={e => setForm({...form, anesthesiaDoctorFee: e.target.value})}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Tests Selection with Searchable Dropdowns */}
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>Select Tests</Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">X-Ray Tests</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              multiple
              options={xrayTests}
              getOptionLabel={(option) => `${option.name} - ₨${option.price}`}
              value={xrayTests.filter(test => form.selectedTests.includes(test._id))}
              onChange={(event, newValue) => {
                const newSelectedIds = newValue.map(test => test._id);
                const otherSelectedTests = form.selectedTests.filter(id => 
                  !xrayTests.some(test => test._id === id)
                );
                setForm({...form, selectedTests: [...otherSelectedTests, ...newSelectedIds]});
              }}
              renderInput={(params) => (
                <TextField {...params} label="Search X-Ray Tests" placeholder="Type to search..." />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option._id}
                    label={`${option.name} - ₨${option.price}`}
                    {...getTagProps({ index })}
                    color="primary"
                  />
                ))
              }
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Ultrasound Tests</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              multiple
              options={ultrasoundTests}
              getOptionLabel={(option) => `${option.name} - ₨${option.price}`}
              value={ultrasoundTests.filter(test => form.selectedTests.includes(test._id))}
              onChange={(event, newValue) => {
                const newSelectedIds = newValue.map(test => test._id);
                const otherSelectedTests = form.selectedTests.filter(id => 
                  !ultrasoundTests.some(test => test._id === id)
                );
                setForm({...form, selectedTests: [...otherSelectedTests, ...newSelectedIds]});
              }}
              renderInput={(params) => (
                <TextField {...params} label="Search Ultrasound Tests" placeholder="Type to search..." />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option._id}
                    label={`${option.name} - ₨${option.price}`}
                    {...getTagProps({ index })}
                    color="secondary"
                  />
                ))
              }
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Other Tests</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              multiple
              options={otherTests}
              getOptionLabel={(option) => `${option.name} - ₨${option.price}`}
              value={otherTests.filter(test => form.selectedTests.includes(test._id))}
              onChange={(event, newValue) => {
                const newSelectedIds = newValue.map(test => test._id);
                const otherSelectedTests = form.selectedTests.filter(id => 
                  !otherTests.some(test => test._id === id)
                );
                setForm({...form, selectedTests: [...otherSelectedTests, ...newSelectedIds]});
              }}
              renderInput={(params) => (
                <TextField {...params} label="Search Other Tests" placeholder="Type to search..." />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option._id}
                    label={`${option.name} - ₨${option.price}`}
                    {...getTagProps({ index })}
                    color="success"
                  />
                ))
              }
            />
          </AccordionDetails>
        </Accordion>

        {/* Selected Tests Summary */}
        {form.selectedTests.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Selected Tests Summary:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {form.selectedTests.map(testId => {
                const test = tests.find(t => t._id === testId);
                return test ? (
                  <Chip
                    key={test._id}
                    label={`${test.name} - ₨${test.price}`}
                    color="primary"
                    onDelete={() => {
                      setForm({...form, selectedTests: form.selectedTests.filter(id => id !== testId)});
                    }}
                  />
                ) : null;
              })}
            </Box>
          </Box>
        )}

        {/* Submit Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            onClick={onAdd}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Patient'}
          </Button>
        </Box>
      </Paper>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Search Patients</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Search"
            value={q}
            onChange={e => setQ(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          />
          <Button 
            variant="contained" 
            onClick={() => dispatch(fetchPatients(q))}
            sx={{ height: '40px' }}
          >
            Search
          </Button>
        </Stack>
      </Paper>

      {/* Patients List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Patients List</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Age</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Gender</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>CNIC</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map(p => (
              <TableRow key={p._id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.age}</TableCell>
                <TableCell>{p.gender}</TableCell>
                <TableCell>{p.contact}</TableCell>
                <TableCell>{p.cnic}</TableCell>
                <TableCell>{p.address}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEdit(p)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(p._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Edit Modal */}
      <Modal open={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
        <Paper sx={{ p: 3, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>Edit Patient</Typography>
          {editingPatient && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Full Name"
                  value={editingPatient.name}
                  onChange={e => setEditingPatient({ ...editingPatient, name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Age"
                  type="number"
                  value={editingPatient.age}
                  onChange={e => setEditingPatient({ ...editingPatient, age: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  select
                  label="Gender"
                  value={editingPatient.gender}
                  onChange={e => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Contact Number"
                  value={editingPatient.contact}
                  onChange={e => setEditingPatient({ ...editingPatient, contact: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="CNIC"
                  value={editingPatient.cnic}
                  onChange={e => setEditingPatient({ ...editingPatient, cnic: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Address"
                  value={editingPatient.address}
                  onChange={e => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditModalOpen(false)} sx={{ mr: 1 }}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdate}>Update Patient</Button>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
}
