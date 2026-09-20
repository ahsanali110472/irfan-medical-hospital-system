// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'

// const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'
// const authHeader = (getState) => ({ headers: { Authorization: `Bearer ${getState().auth.token}` } })

// export const fetchBills = createAsyncThunk('bills/fetch', async (status, { getState }) => {
//   const qs = status?`?status=${status}`:''
//   const { data } = await axios.get(`${API}/bills${qs}`, authHeader(getState))
//   return data
// })

// // Now backend builds bill from selected patient visit details
// export const createBill = createAsyncThunk('bills/create', async (payload, { getState }) => {
//   const { data } = await axios.post(`${API}/bills`, { patientId: payload.patientId }, authHeader(getState))
//   return data
// })

// export const payBill = createAsyncThunk('bills/pay', async (id, { getState }) => {
//   const { data } = await axios.post(`${API}/bills/${id}/pay`, {}, authHeader(getState))
//   return data
// })

// const slice = createSlice({
//   name: 'bills',
//   initialState: { list: [], loading: false, error: null },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchBills.pending, (s)=>{s.loading=true; s.error=null})
//       .addCase(fetchBills.fulfilled, (s,a)=>{s.loading=false; s.list=a.payload})
//       .addCase(fetchBills.rejected, (s,a)=>{s.loading=false; s.error=a.error.message})
//       .addCase(createBill.fulfilled, (s,a)=>{s.list.unshift(a.payload)})
//       .addCase(payBill.fulfilled, (s,a)=>{
//         const idx = s.list.findIndex(b=>b._id===a.payload._id)
//         if (idx>-1) s.list[idx]=a.payload
//       })
//   }
// })

// export default slice.reducer


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import Swal from 'sweetalert2'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'
const authHeader = (getState) => ({ headers: { Authorization: `Bearer ${getState().auth.token}` } })

export const fetchBills = createAsyncThunk('bills/fetch', async (status, { getState }) => {
  const qs = status?`?status=${status}`:''
  const { data } = await axios.get(`${API}/bills${qs}`, authHeader(getState))
  return data
})

export const createBill = createAsyncThunk('bills/create', async (payload, { getState }) => {
  const { data } = await axios.post(`${API}/bills`, { patientId: payload.patientId }, authHeader(getState))
  return data
})

export const payBill = createAsyncThunk('bills/pay', async (id, { getState }) => {
  const { data } = await axios.post(`${API}/bills/${id}/pay`, {}, authHeader(getState))
  return data
})

export const deleteBill = createAsyncThunk('bills/delete', async (id, { getState }) => {
  const { data } = await axios.delete(`${API}/bills/${id}`, authHeader(getState))
  return data
})

const slice = createSlice({
  name: 'bills',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (s)=>{s.loading=true; s.error=null})
      .addCase(fetchBills.fulfilled, (s,a)=>{s.loading=false; s.list=a.payload})
      .addCase(fetchBills.rejected, (s,a)=>{s.loading=false; s.error=a.error.message})
      .addCase(createBill.fulfilled, (s,a)=>{s.list.unshift(a.payload)})
      .addCase(payBill.fulfilled, (s,a)=>{
        const idx = s.list.findIndex(b=>b._id===a.payload._id)
        if (idx>-1) s.list[idx]=a.payload
      })
      .addCase(deleteBill.fulfilled, (s,a)=>{
        s.list = s.list.filter(bill => bill._id !== a.payload._id)
      })
  }
})

export const confirmDeleteBill = (id) => async (dispatch) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  })

  if (result.isConfirmed) {
    try {
      await dispatch(deleteBill(id))
      Swal.fire('Deleted!', 'The bill has been deleted.', 'success')
    } catch (error) {
      console.error('Failed to delete bill:', error);
      Swal.fire('Error!', 'Failed to delete the bill.', 'error')
    }
  }
}

export default slice.reducer