import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const FILE = 'controllers/matchController.js';

// A match exists when:
// trip.source = request.source AND trip.destination = request.destination
// AND trip.travel_date >= request.created_at::date AND trip.travel_date <= request.needed_by
// AND trip.status = 'active' AND request.status = 'pending'
// Matches are always calculated dynamically, never stored.

async function findMatchesForTrip(trip) {
  const { data: requests, error } = await supabase
    .from('requests')
    .select('*')
    .eq('source', trip.source)
    .eq('destination', trip.destination)
    .eq('status', 'pending')
    .gte('needed_by', trip.travel_date);

  if (error) throw new AppError(error.message, 500, FILE);

  const tripDate = new Date(trip.travel_date);

  const dateFiltered = requests.filter((r) => {
    const createdDate = new Date(r.created_at);
    createdDate.setHours(0, 0, 0, 0);
    const compareTripDate = new Date(tripDate);
    compareTripDate.setHours(0, 0, 0, 0);
    return compareTripDate >= createdDate;
  });

  const { data: existingPairs, error: pairError } = await supabase
    .from('delivery_requests')
    .select('request_id')
    .eq('trip_id', trip.id);

  if (pairError) throw new AppError(pairError.message, 500, FILE);

  const excludedRequestIds = new Set((existingPairs || []).map((p) => p.request_id));

  return dateFiltered.filter((r) => !excludedRequestIds.has(r.id));
}

export async function getMatches(req, res, next) {
  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    if (error) throw new AppError(error.message, 500, FILE);

    const results = await Promise.all(
      trips.map(async (trip) => ({
        trip,
        matchingRequests: await findMatchesForTrip(trip)
      }))
    );

    res.json(results);
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function getMatchesForTrip(req, res, next) {
  try {
    const { tripId } = req.params;
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error || !trip) throw new AppError('Trip not found', 404, FILE);
    if (trip.user_id !== req.user.id) throw new AppError('You do not own this trip', 403, FILE);
    if (trip.status !== 'active') return res.json([]);

    const matchingRequests = await findMatchesForTrip(trip);
    res.json(matchingRequests);
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}
