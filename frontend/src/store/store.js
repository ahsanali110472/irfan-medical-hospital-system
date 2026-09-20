import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import patientReducer from './slices/patientSlice.js'
import billReducer from './slices/billSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientReducer,
    bills: billReducer
  }
})





