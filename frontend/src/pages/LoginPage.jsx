import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Box, Paper, TextField, Button, Typography, Stack, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { login } from '../store/slices/authSlice.js'

export default function LoginPage(){
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector(s=>s.auth)
  const [email, setEmail] = React.useState('admin@hms.local')
  const [password, setPassword] = React.useState('admin123')
  const [showPassword, setShowPassword] = React.useState(false)

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => { event.preventDefault(); };

  React.useEffect(()=>{ if(token) navigate('/') },[token])

  const onSubmit = async (e)=>{
    e.preventDefault()
    await dispatch(login({ email, password }))
  }

  return (
    <>
    
    <Paper sx={{ p:4, width:400 }}>
      <Typography variant="h4" sx={{ mb:2,textAlign:'center' }}>Irfan Medical Center Login</Typography>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Email" value={email} onChange={e=>setEmail(e.target.value)} fullWidth />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e=>setPassword(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
            {error && <Typography color="error">{error}</Typography>}
            <Button type="submit" variant="contained" disabled={loading}>Sign In</Button>
          </Stack>
        </form>
      </Paper>
    </>
  )
}





