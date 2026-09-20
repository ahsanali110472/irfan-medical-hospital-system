import React from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Box, Paper, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, InputAdornment, IconButton, Modal, Grid, Typography } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

export default function UsersPage(){
  const { token } = useSelector(s=>s.auth)
  const [list, setList] = React.useState([])
  const [form, setForm] = React.useState({ name:'', email:'', password:'', role:'receptionist' })
  const [showPassword, setShowPassword] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState(null)
  const [isEditModalOpen, setEditModalOpen] = React.useState(false)

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => { event.preventDefault(); };

  const load = async ()=>{
    const { data } = await axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
    setList(data)
  }
  React.useEffect(()=>{ load() },[])

  const add = async ()=>{
    await axios.post(`${API}/users`, form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ name:'', email:'', password:'', role:'receptionist' })
    await load()
  }

  const handleDelete = async (id)=>{
    if(window.confirm('Are you sure you want to delete this user?')){
      await axios.delete(`${API}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      await load()
    }
  }

  const handleEdit = (user)=>{
    setEditingUser(user)
    setEditModalOpen(true)
  }

  const handleUpdate = async ()=>{
    await axios.put(`${API}/users/${editingUser._id}`, editingUser, { headers: { Authorization: `Bearer ${token}` } })
    setEditModalOpen(false)
    setEditingUser(null)
    await load()
  }

  return (
    <Box>
      <Paper sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
          <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <TextField label="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={e=>setForm({...form, password:e.target.value})}
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
          <TextField select label="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="receptionist">Receptionist</MenuItem>
          </TextField>
          <Button variant="contained" onClick={add}>Add</Button>
        </Stack>
      </Paper>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map(u=> (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <Button size="small" onClick={()=>handleEdit(u)}>Edit</Button>
                  <Button size="small" color="error" onClick={()=>handleDelete(u._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Modal open={isEditModalOpen} onClose={()=>setEditModalOpen(false)}>
        <Paper sx={{ p:3, position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', width:400 }}>
          <Typography variant="h6" sx={{ mb:2 }}>Edit User</Typography>
          {editingUser && (
            <Stack spacing={2}>
              <TextField label="Name" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name:e.target.value})} />
              <TextField label="Email" value={editingUser.email} onChange={e=>setEditingUser({...editingUser, email:e.target.value})} />
              <TextField select label="Role" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role:e.target.value})}>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="receptionist">Receptionist</MenuItem>
              </TextField>
              <Button variant="contained" onClick={handleUpdate}>Update</Button>
              <Button variant="outlined" onClick={()=>setEditModalOpen(false)}>Cancel</Button>
            </Stack>
          )}
        </Paper>
      </Modal>
    </Box>
  )
}





