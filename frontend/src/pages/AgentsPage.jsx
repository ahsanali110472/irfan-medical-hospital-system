import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Paper, Stack, TextField, Button, Typography, Grid,
  Table, TableHead, TableRow, TableCell, TableBody, MenuItem,
  Autocomplete, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alertSuccess, alertError } from '../utils/toast.js';
import axios from 'axios';

export default function AgentsPage() {
  const { token, user } = useSelector(s => s.auth);
  const [agents, setAgents] = React.useState([]);
  const [selectedAgent, setSelectedAgent] = React.useState(null);
  const [agentPatients, setAgentPatients] = React.useState([]);
  const [commissions, setCommissions] = React.useState([]);
  const [newAgent, setNewAgent] = React.useState({ name: '', contact: '' });
  const [commissionForm, setCommissionForm] = React.useState({ patientId: '', commissionAmount: '' });
  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
  const canManageAgents = user?.role === 'admin' || user?.role === 'receptionist';

  React.useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data } = await axios.get(`${API}/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(data);
    } catch (error) {
      alertError('Failed to load agents');
    }
  };

  const createAgent = async () => {
    if (!newAgent.name) {
      alertError('Agent name is required');
      return;
    }
    try {
      await axios.post(`${API}/agents`, newAgent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alertSuccess('Agent created successfully');
      setNewAgent({ name: '', contact: '' });
      loadAgents();
    } catch (error) {
      alertError('Failed to create agent');
    }
  };

  const loadAgentData = async (agent) => {
    try {
      setSelectedAgent(agent);
      
      // Load agent's patients
      const { data: patientsData } = await axios.get(`${API}/agents/${agent._id}/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgentPatients(patientsData.patients || []);

      // Load agent's commissions
      const { data: commissionsData } = await axios.get(`${API}/agents/${agent._id}/commissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommissions(commissionsData);
    } catch (error) {
      alertError('Failed to load agent data');
    }
  };

  const addCommission = async () => {
    if (!commissionForm.patientId || !commissionForm.commissionAmount) {
      alertError('Please select patient and enter commission amount');
      return;
    }
    try {
      await axios.post(`${API}/agents/commission`, {
        agentId: selectedAgent._id,
        patientId: commissionForm.patientId,
        commissionAmount: Number(commissionForm.commissionAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alertSuccess('Commission added successfully');
      setCommissionForm({ patientId: '', commissionAmount: '' });
      loadAgentData(selectedAgent); // Refresh data
    } catch (error) {
      alertError('Failed to add commission');
    }
  };

  const payCommission = async (commissionId) => {
    try {
      await axios.post(`${API}/agents/commission/${commissionId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alertSuccess('Commission paid successfully');
      loadAgentData(selectedAgent); // Refresh data
    } catch (error) {
      alertError('Failed to pay commission');
    }
  };

  const deleteAgent = async (agentId) => {
    try {
      await axios.delete(`${API}/agents/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alertSuccess('Agent deleted successfully');
      loadAgents();
      // Clear selection if deleted agent was selected
      if (selectedAgent && selectedAgent._id === agentId) {
        setSelectedAgent(null);
        setAgentPatients([]);
        setCommissions([]);
      }
    } catch (error) {
      alertError(error.response?.data?.message || 'Failed to delete agent');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={3}>
        {/* Create New Agent - Admin & Receptionist */}
        {canManageAgents && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Create New Agent</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Agent Name"
                  value={newAgent.name}
                  onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Contact"
                  value={newAgent.contact}
                  onChange={e => setNewAgent({...newAgent, contact: e.target.value})}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button variant="contained" onClick={createAgent} fullWidth>
                  Create Agent
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Agents Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>All Agents ({agents.length})</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>Total Earned</strong></TableCell>
                <TableCell><strong>Total Paid</strong></TableCell>
                <TableCell><strong>Pending</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent._id}>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.contact || 'N/A'}</TableCell>
                  <TableCell>₨{agent.totalCommissionEarned?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>₨{agent.totalCommissionPaid?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>₨{agent.pendingCommission?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => loadAgentData(agent)}
                      >
                        View Details
                      </Button>
                      {canManageAgents && (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete agent "${agent.name}"?`)) {
                              deleteAgent(agent._id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {agents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      {canManageAgents ? 'No agents found. Create your first agent above.' : 'No agents found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Agent Selection */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Select Agent for Details</Typography>
          <Autocomplete
            options={agents}
            getOptionLabel={(option) => option.name}
            value={selectedAgent}
            onChange={(event, newValue) => {
              if (newValue) {
                loadAgentData(newValue);
              } else {
                setSelectedAgent(null);
                setAgentPatients([]);
                setCommissions([]);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Search Agent" placeholder="Select an agent..." />
            )}
            fullWidth
          />
        </Paper>

        {selectedAgent && (
          <>
            {/* Agent Summary */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Agent Summary: {selectedAgent.name}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="body2">Total Earned</Typography>
                    <Typography variant="h5">₨{selectedAgent.totalCommissionEarned?.toFixed(2) || '0.00'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="body2">Total Paid</Typography>
                    <Typography variant="h5">₨{selectedAgent.totalCommissionPaid?.toFixed(2) || '0.00'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                    <Typography variant="body2">Pending</Typography>
                    <Typography variant="h5">₨{selectedAgent.pendingCommission?.toFixed(2) || '0.00'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                    <Typography variant="body2">Total Patients</Typography>
                    <Typography variant="h5">{agentPatients.length}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>

            {/* Agent's Patients */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Agent's Patients ({agentPatients.length})</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Total Received</TableCell>
                    <TableCell>Current Balance</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agentPatients.map(patient => (
                    <TableRow key={patient._id}>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.contact || 'N/A'}</TableCell>
                      <TableCell>₨{patient.totalAmountReceived?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>₨{patient.currentBalance?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setCommissionForm({...commissionForm, patientId: patient._id})}
                        >
                          Add Commission
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            {/* Add Commission */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Add Commission</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={agentPatients}
                    getOptionLabel={(option) => `${option.name} - Balance: ₨${option.currentBalance?.toFixed(2) || '0.00'}`}
                    value={agentPatients.find(p => p._id === commissionForm.patientId) || null}
                    onChange={(event, newValue) => {
                      setCommissionForm({...commissionForm, patientId: newValue?._id || ''});
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Patient" />
                    )}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Commission Amount (PKR)"
                    type="number"
                    value={commissionForm.commissionAmount}
                    onChange={e => setCommissionForm({...commissionForm, commissionAmount: e.target.value})}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button variant="contained" onClick={addCommission} fullWidth>
                    Add Commission
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Commissions History */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Commission History</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Commission Amount</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commissions.map(commission => (
                    <TableRow key={commission._id}>
                      <TableCell>{commission.patient?.name || 'N/A'}</TableCell>
                      <TableCell>₨{commission.commissionAmount?.toFixed(2)}</TableCell>
                      <TableCell>{commission.commissionRate}%</TableCell>
                      <TableCell>{commission.status}</TableCell>
                      <TableCell>{new Date(commission.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {commission.status === 'pending' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => payCommission(commission._id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}
