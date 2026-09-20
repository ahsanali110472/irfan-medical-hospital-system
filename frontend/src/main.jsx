import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import App from './App.jsx'
import { store } from './store/store.js'

// Make store available globally for API interceptor
window.__store__ = store;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <CssBaseline />
        <App />
      </HashRouter>
    </Provider>
  </React.StrictMode>
)


