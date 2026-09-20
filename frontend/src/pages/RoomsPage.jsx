import React from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Box, Paper, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Typography } from '@mui/material'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

export default function RoomsPage(){
  const { token } = useSelector(s=>s.auth)
  const [list, setList] = React.useState([])
  const [form, setForm] = React.useState({ name:'', features:'', price:'', type:'xray' })

  const headers = { headers: { Authorization: `Bearer ${token}` } }

  const load = async ()=>{
    const { data } = await axios.get(`${API}/rooms`, headers)
    setList(data.filter(r=> ['xray','ultrasound','test'].includes(r.type)))
  }
  React.useEffect(()=>{ load() },[])

  const add = async ()=>{
    if(!form.name || !form.price) return
    await axios.post(`${API}/rooms`, { ...form, price: Number(form.price), features: form.features? form.features.split(',').map(s=>s.trim()): [] }, headers)
    setForm({ name:'', features:'', price:'', type:'xray' })
    await load()
  }

  const save = async (room)=>{
    await axios.put(`${API}/rooms/${room._id}`, room, headers)
    await load()
  }

  const remove = async (id)=>{
    await axios.delete(`${API}/rooms/${id}`, headers)
    await load()
  }

  return (
    <Box>
      <Paper sx={{ p:2, mb:2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Tests (X-Ray / Ultrasound)</Typography>
        <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
          <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <TextField label="Features (comma separated)" value={form.features} onChange={e=>setForm({...form, features:e.target.value})} />
          <TextField label="Price" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} />
          <TextField select label="Type" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
            <MenuItem value="xray">X-Ray</MenuItem>
            <MenuItem value="ultrasound">Ultrasound</MenuItem>
            <MenuItem value="test">Test</MenuItem>
          </TextField>
          <Button variant="contained" onClick={add}>Add</Button>
        </Stack>
      </Paper>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Features</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.filter(r=>['xray','ultrasound','test'].includes(r.type)).map(r=> (
              <TableRow key={r._id}>
                <TableCell>
                  <TextField size="small" value={r.name} onChange={e=>r.name=e.target.value} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={r.features?.join(', ')||''} onChange={e=>r.features=e.target.value.split(',').map(s=>s.trim())} />
                </TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>
                  <TextField size="small" value={r.price} onChange={e=>r.price=Number(e.target.value)} />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={()=>save(r)}>Save</Button>
                  <Button size="small" color="error" onClick={()=>remove(r._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}


