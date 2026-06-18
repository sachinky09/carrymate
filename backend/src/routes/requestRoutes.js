import express from 'express';
import { createRequest, getMyRequests, cancelRequest } from '../controllers/requestController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadSingleImage } from '../middleware/upload.js';

const router = express.Router();

router.use(requireAuth);
router.post('/', uploadSingleImage, createRequest);
router.get('/mine', getMyRequests);
router.patch('/:id/cancel', cancelRequest);

export default router;
