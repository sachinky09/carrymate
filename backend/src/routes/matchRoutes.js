import express from 'express';
import { getMatches, getMatchesForTrip } from '../controllers/matchController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getMatches);
router.get('/trip/:tripId', getMatchesForTrip);

export default router;
