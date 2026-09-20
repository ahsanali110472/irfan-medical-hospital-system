import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, AppBar, Toolbar, Typography, IconButton, Container, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, Tooltip, Avatar, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import { getTheme } from './theme.js'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssessmentIcon from '@mui/icons-material/Assessment'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import GroupIcon from '@mui/icons-material/Group'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PatientsPage from './pages/PatientsPage.jsx'
import BillingPage from './pages/BillingPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import RoomsPage from './pages/RoomsPage.jsx'
import AgentsPage from './pages/AgentsPage.jsx'
import DoctorsPage from './pages/DoctorsPage.jsx'
import AppointmentsPage from './pages/AppointmentsPage.jsx'
import { logout } from './store/slices/authSlice.js'

const Footer = () => (
  <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
    <Typography variant="body2">Powered by Try Unity Solutions</Typography>
    <Typography variant="body2">Email: infotryunity@gmail.com | Contact: 03023476605</Typography>
  </Box>
)

const PrivateRoute = ({ children, roles }) => {
  const auth = useSelector((s) => s.auth)
  if (!auth.token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(auth.user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useSelector(s=>s.auth)
  const [dark, setDark] = React.useState(() => localStorage.getItem('themeMode') === 'dark')
  const [open, setOpen] = React.useState(true)
  const drawerWidth = 240
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const setTheme = (isDark) => {
    setDark(isDark)
    localStorage.setItem('themeMode', isDark ? 'dark' : 'light')
  }

  const go = (path) => () => { navigate(path); if (window.innerWidth < 900) setOpen(false) }
  const onLogout = () => { dispatch(logout()); navigate('/login', { replace: true }) }

  const isAdmin = auth.user?.role === 'admin'

  return (
    <ThemeProvider theme={getTheme(dark? 'dark':'light')}>
      <Box sx={{ display: 'flex', minWidth:'100%', minHeight: '100vh', bgcolor: 'background.default' }}>
        {auth.token && (
          <AppBar position="fixed" color="primary" sx={{
            zIndex: (t)=> t.zIndex.drawer + 1,
            ml: isDesktop ? `${drawerWidth}px` : 0,
            width: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%'
          }}>
            <Toolbar>
              {!isDesktop && (
                <IconButton color="inherit" edge="start" onClick={()=>setOpen(o=>!o)} sx={{ mr: 1 }}>
                <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ flexGrow: 1 }}>HMS</Typography>
              <Tooltip title={dark? 'Light mode':'Dark mode'}>
                <IconButton color="inherit" onClick={() => setTheme(!dark)}>
                  {dark ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              {auth.user && (
                <Tooltip title={`${auth.user.name} (${auth.user.role})`}>
                  <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>{auth.user.name?.[0]?.toUpperCase()||'U'}</Avatar>
                </Tooltip>
              )}
            </Toolbar>
          </AppBar>
        )}

        {auth.token && (
          <Drawer
            variant={isDesktop ? 'permanent' : 'temporary'}
            open={isDesktop ? true : open}
            onClose={()=>setOpen(false)}
            sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                <ListItemButton onClick={go('/')} selected={location.pathname === '/'}> <ListItemIcon><DashboardIcon /></ListItemIcon><ListItemText primary="Dashboard" /></ListItemButton>
                <ListItemButton onClick={go('/patients')} selected={location.pathname === '/patients'}> <ListItemIcon><PeopleIcon /></ListItemIcon><ListItemText primary="Patients" /></ListItemButton>
                <ListItemButton onClick={go('/billing')} selected={location.pathname === '/billing'}> <ListItemIcon><ReceiptLongIcon /></ListItemIcon><ListItemText primary="Billing" /></ListItemButton>
                <ListItemButton onClick={go('/appointments')} selected={location.pathname === '/appointments'}> <ListItemIcon><EventAvailableIcon /></ListItemIcon><ListItemText primary="Appointments" /></ListItemButton>
                <ListItemButton onClick={go('/agents')} selected={location.pathname === '/agents'}> <ListItemIcon><GroupIcon /></ListItemIcon><ListItemText primary="Agents" /></ListItemButton>
                {isAdmin && <ListItemButton onClick={go('/reports')} selected={location.pathname === '/reports'}> <ListItemIcon><AssessmentIcon /></ListItemIcon><ListItemText primary="Reports" /></ListItemButton>}
                {isAdmin && <ListItemButton onClick={go('/doctors')} selected={location.pathname === '/doctors'}> <ListItemIcon><MedicalServicesIcon /></ListItemIcon><ListItemText primary="Doctors" /></ListItemButton>}
                {isAdmin && <ListItemButton onClick={go('/rooms')} selected={location.pathname === '/rooms'}> <ListItemIcon><MeetingRoomIcon /></ListItemIcon><ListItemText primary="Rooms/X-Ray/Ultrasound" /></ListItemButton>}
                {isAdmin && <ListItemButton onClick={go('/users')} selected={location.pathname === '/users'}> <ListItemIcon><ManageAccountsIcon /></ListItemIcon><ListItemText primary="Users" /></ListItemButton>}
              </List>
              <Divider />
              <List>
                <ListItemButton onClick={onLogout}> <ListItemIcon><LogoutIcon /></ListItemIcon><ListItemText primary="Logout" /></ListItemButton>
              </List>
            </Box>
          </Drawer>
        )}

        <Box component="main" sx={{ display:'flex', flexDirection:'column', minHeight:'100vh', ml: isDesktop ? `${drawerWidth}px` : 0, width: '100%' }}>
          {auth.token && <Toolbar />}
          <Box sx={{ py: location.pathname === '/login' ? 0 : 3, flex: 1, width: '100%', overflowX: 'hidden' }}>
            <Routes>
              <Route path="/login" element={
                <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
                  <LoginPage />
                </Box>
              } />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/patients" element={<PrivateRoute roles={['admin','receptionist']}><PatientsPage /></PrivateRoute>} />
              <Route path="/billing" element={<PrivateRoute roles={['admin','receptionist']}><BillingPage /></PrivateRoute>} />
              <Route path="/appointments" element={<PrivateRoute roles={['admin','receptionist']}><AppointmentsPage /></PrivateRoute>} />
              <Route path="/agents" element={<PrivateRoute roles={['admin','receptionist']}><AgentsPage /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute roles={['admin','receptionist']}><ReportsPage /></PrivateRoute>} />
              <Route path="/doctors" element={<PrivateRoute roles={['admin']}><DoctorsPage /></PrivateRoute>} />
              <Route path="/rooms" element={<PrivateRoute roles={['admin']}><RoomsPage /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

