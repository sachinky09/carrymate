import express from 'express';
import {
  acceptRequest,
  rejectRequest,
  markDelivered,
  cancelAcceptedDelivery,
  getMyDeliveries
} from '../controllers/deliveryController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/mine', getMyDeliveries);
router.post('/accept', acceptRequest);
router.post('/reject', rejectRequest);
router.patch('/:id/deliver', markDelivered);
router.patch('/:id/cancel', cancelAcceptedDelivery);

export default router;
