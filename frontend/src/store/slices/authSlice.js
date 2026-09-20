import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

export const login = createAsyncThunk('auth/login', async (payload) => {
  const { data } = await axios.post(`${API}/auth/login`, payload)
  return data
})

const tokenFromStorage = localStorage.getItem('token')
const userFromStorage = localStorage.getItem('user')

const slice = createSlice({
  name: 'auth',
  initialState: { token: tokenFromStorage || null, user: userFromStorage ? JSON.parse(userFromStorage) : null, loading: false, error: null },
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.error.message })
  }
})

export const { logout } = slice.actions
export default slice.reducer





