import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'
const authHeader = (getState) => ({ headers: { Authorization: `Bearer ${getState().auth.token}` } })

export const fetchPatients = createAsyncThunk('patients/fetch', async (q, { getState }) => {
  const { data } = await axios.get(`${API}/patients${q?`?q=${encodeURIComponent(q)}`:''}`, authHeader(getState))
  return data
})

export const createPatient = createAsyncThunk('patients/create', async (payload, { getState }) => {
  const { data } = await axios.post(`${API}/patients`, payload, authHeader(getState))
  return data
})

export const updatePatient = createAsyncThunk('patients/update', async (payload, { getState }) => {
  const { data } = await axios.put(`${API}/patients/${payload._id}`, payload, authHeader(getState))
  return data
})

export const deletePatient = createAsyncThunk('patients/delete', async (id, { getState }) => {
  await axios.delete(`${API}/patients/${id}`, authHeader(getState))
  return id
})

export const fetchPatientsForBilling = createAsyncThunk('patients/fetchForBilling', async (_, { getState }) => {
  const { data } = await axios.get(`${API}/patients/billing/unpaid`, authHeader(getState))
  return data
})

const slice = createSlice({
  name: 'patients',
  initialState: { list: [], billingList: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (s)=>{s.loading=true; s.error=null})
      .addCase(fetchPatients.fulfilled, (s,a)=>{s.loading=false; s.list=a.payload})
      .addCase(fetchPatients.rejected, (s,a)=>{s.loading=false; s.error=a.error.message})
      .addCase(fetchPatientsForBilling.pending, (s)=>{s.loading=true; s.error=null})
      .addCase(fetchPatientsForBilling.fulfilled, (s,a)=>{s.loading=false; s.billingList=a.payload})
      .addCase(fetchPatientsForBilling.rejected, (s,a)=>{s.loading=false; s.error=a.error.message})
      .addCase(createPatient.fulfilled, (s,a)=>{s.list.unshift(a.payload)})
      .addCase(updatePatient.fulfilled, (s, a) => {
        const index = s.list.findIndex(p => p._id === a.payload._id)
        if (index !== -1) {
          s.list[index] = a.payload
        }
      })
      .addCase(deletePatient.fulfilled, (s, a) => {
        s.list = s.list.filter(p => p._id !== a.payload)
      })
  }
})

export default slice.reducer





