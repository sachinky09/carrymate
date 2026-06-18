import express from 'express';
import { createTrip, getMyTrips, deleteTrip } from '../controllers/tripController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.post('/', createTrip);
router.get('/mine', getMyTrips);
router.delete('/:id', deleteTrip);

export default router;
