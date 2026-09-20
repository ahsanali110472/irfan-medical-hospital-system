import Room from '../models/Room.js';

export const createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({ message: 'Error creating room', error: error.message });
  }
};

export const listRooms = async (req, res) => {
  const rooms = await Room.find().sort({ name: 1 });
  res.json(rooms);
};

export const updateRoom = async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
};

export const deleteRoom = async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json({ success: true });
};





