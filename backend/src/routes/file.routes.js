import express from 'express';
import { uploadFile, getFile } from '../controllers/file.controller.js';

const router = express.Router();

// Route to upload a file
router.post('/patients/:id/files', uploadFile);

// Route to get a specific file
router.get('/patients/:id/files/:fileId', getFile);

export default router;
