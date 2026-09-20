import mongoose from 'mongoose';
import Grid from 'gridfs-stream';
import multer from 'multer';
import multerGridFsStorage from 'multer-gridfs-storage';
import { MongoClient } from 'mongodb';

// MongoDB connection
const mongoURI = process.env.MONGO_URI; // Ensure this is set in your .env file
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads'); // Set the collection name
});

// Create storage engine
const storage = new multerGridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: 'uploads' // Collection name
    };
  }
});

const upload = multer({ storage });

// Upload file
export const uploadFile = (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'Error uploading file' });
    res.status(201).json({ file: req.file });
  });
};

// Get file
export const getFile = async (req, res) => {
  gfs.files.findOne({ _id: req.params.fileId }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    const readstream = gfs.createReadStream(file._id);
    readstream.pipe(res);
  });
};
