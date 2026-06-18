import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { involvesNitDurgapur, isPositiveNumber, isValidDateString } from '../utils/validators.js';

const FILE = 'controllers/tripController.js';

export async function createTrip(req, res, next) {
  try {
    const { source, destination, travel_date, available_weight } = req.body;
    if (!source || !destination || !travel_date || available_weight === undefined) {
      throw new AppError('source, destination, travel_date and available_weight are required', 400, FILE);
    }
    if (!involvesNitDurgapur(source, destination)) {
      throw new AppError('Every trip must involve NIT Durgapur', 400, FILE);
    }
    if (!isValidDateString(travel_date)) {
      throw new AppError('Invalid travel_date', 400, FILE);
    }
    if (!isPositiveNumber(available_weight)) {
      throw new AppError('available_weight must be greater than 0', 400, FILE);
    }

    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: req.user.id,
        source,
        destination,
        travel_date,
        available_weight,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, FILE);
    res.status(201).json(data);
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function getMyTrips(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500, FILE);
    res.json(data);
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const { id } = req.params;
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !trip) throw new AppError('Trip not found', 404, FILE);
    if (trip.user_id !== req.user.id) throw new AppError('You do not own this trip', 403, FILE);

    const { error: deleteError } = await supabase.from('trips').delete().eq('id', id);
    if (deleteError) throw new AppError(deleteError.message, 500, FILE);

    res.json({ message: 'Trip deleted' });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}
