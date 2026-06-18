import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { involvesNitDurgapur, isPositiveNumber, isValidDateString } from '../utils/validators.js';
import { uploadRequestImage, getSignedImageUrl } from '../services/storageService.js';

const FILE = 'controllers/requestController.js';

export async function createRequest(req, res, next) {
  try {
    const {
      source,
      destination,
      item_name,
      item_description,
      weight,
      needed_by
    } = req.body;

    if (!source || !destination || !item_name || !weight || !needed_by) {
      throw new AppError(
        'source, destination, item_name, weight and needed_by are required',
        400,
        FILE
      );
    }

    if (!involvesNitDurgapur(source, destination)) {
      throw new AppError(
        'Every request must involve NIT Durgapur',
        400,
        FILE
      );
    }

    if (!isPositiveNumber(weight)) {
      throw new AppError('weight must be greater than 0', 400, FILE);
    }

    if (!isValidDateString(needed_by)) {
      throw new AppError('Invalid needed_by date', 400, FILE);
    }

    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        sender_id: req.user.id,
        source,
        destination,
        item_name,
        item_description: item_description || '',
        weight,
        needed_by,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new AppError(error.message, 500, FILE);
    }

    if (req.file) {
      const imagePath = await uploadRequestImage(
        request.id,
        req.file.buffer,
        req.file.mimetype
      );

      const { error: updateError } = await supabase
        .from('requests')
        .update({ image_url: imagePath })
        .eq('id', request.id);

      if (updateError) {
        throw new AppError(updateError.message, 500, FILE);
      }

      request.image_url = imagePath;
    }

    res.status(201).json(request);
  } catch (error) {
    next(
      error.isAppError
        ? error
        : new AppError(error.message, 500, FILE)
    );
  }
}

export async function getMyRequests(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        delivery_requests (
          id,
          status,
          trip_id,
          trips (
            user_id,
            users (
              name,
              phone
            )
          )
        )
      `)
      .eq('sender_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(error.message, 500, FILE);
    }

    const withSignedUrls = await Promise.all(
      (data || []).map(async (r) => {
        const acceptedDelivery =
          r.delivery_requests?.find(
            (d) => d.status === 'accepted'
          ) || null;

        return {
          ...r,
          image_signed_url: r.image_url
            ? await getSignedImageUrl(r.image_url)
            : '',

          acceptor_name:
            acceptedDelivery?.trips?.users?.name || null,

          acceptor_phone:
            acceptedDelivery?.trips?.users?.phone || null
        };
      })
    );

    res.json(withSignedUrls);
  } catch (error) {
    next(
      error.isAppError
        ? error
        : new AppError(error.message, 500, FILE)
    );
  }
}

export async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params;

    const { data: request, error: fetchError } = await supabase
      .from('requests')
      .select('id, sender_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      throw new AppError('Request not found', 404, FILE);
    }

    if (request.sender_id !== req.user.id) {
      throw new AppError('You do not own this request', 403, FILE);
    }

    if (request.status !== 'pending') {
      throw new AppError(
        'Only pending requests can be cancelled',
        400,
        FILE
      );
    }

    const { error: updateError } = await supabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      throw new AppError(updateError.message, 500, FILE);
    }

    res.json({ message: 'Request cancelled' });
  } catch (error) {
    next(
      error.isAppError
        ? error
        : new AppError(error.message, 500, FILE)
    );
  }
}