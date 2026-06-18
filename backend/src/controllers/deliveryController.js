import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { isNonNegativeNumber } from '../utils/validators.js';
import { adjustTrustScore } from '../services/trustScoreService.js';
import {
  sendRequestAcceptedEmail,
  sendRequestRejectedEmail,
  sendDeliveryCompletedEmail
} from '../services/emailService.js';
import {
  sendRequestAcceptedSms,
  sendRequestRejectedSms,
  sendDeliveryCompletedSms
} from '../services/smsService.js';

const FILE = 'controllers/deliveryController.js';

function matchesRule(trip, request) {
  if (trip.source !== request.source || trip.destination !== request.destination) return false;
  if (trip.status !== 'active' || request.status !== 'pending') return false;
  const tripDate = new Date(trip.travel_date);
  const createdDate = new Date(request.created_at);
  const neededBy = new Date(request.needed_by);
  return tripDate >= createdDate && tripDate <= neededBy;
}

async function fetchTripAndRequest(tripId, requestId) {
  const { data: trip, error: tripError } = await supabase.from('trips').select('*').eq('id', tripId).single();
  if (tripError || !trip) throw new AppError('Trip not found', 404, FILE);

  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (requestError || !request) throw new AppError('Request not found', 404, FILE);

  return { trip, request };
}

export async function acceptRequest(req, res, next) {
  try {
    const { trip_id, request_id, delivery_fee } = req.body;
    if (!trip_id || !request_id) throw new AppError('trip_id and request_id are required', 400, FILE);

    const fee = delivery_fee === undefined ? 0 : delivery_fee;
    if (!isNonNegativeNumber(fee)) throw new AppError('delivery_fee must be >= 0', 400, FILE);

    const { trip, request } = await fetchTripAndRequest(trip_id, request_id);
    if (trip.user_id !== req.user.id) throw new AppError('You do not own this trip', 403, FILE);
    if (!matchesRule(trip, request)) throw new AppError('This trip and request do not match', 400, FILE);

    const { data: delivery, error } = await supabase
      .from('delivery_requests')
      .insert({ trip_id, request_id, delivery_fee: fee, status: 'accepted' })
      .select()
      .single();
    if (error) throw new AppError(error.message, 500, FILE);

    const { error: reqUpdateError } = await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', request_id);
    if (reqUpdateError) throw new AppError(reqUpdateError.message, 500, FILE);

    const { data: sender } = await supabase.from('users').select('email, phone').eq('id', request.sender_id).single();
    if (sender) {
      await sendRequestAcceptedEmail(sender.email, request.item_name);
      await sendRequestAcceptedSms(sender.phone, request.item_name);
    }

    res.status(201).json(delivery);
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function rejectRequest(req, res, next) {
  try {
    const { trip_id, request_id } = req.body;
    if (!trip_id || !request_id) throw new AppError('trip_id and request_id are required', 400, FILE);

    const { trip, request } = await fetchTripAndRequest(trip_id, request_id);
    if (trip.user_id !== req.user.id) throw new AppError('You do not own this trip', 403, FILE);
    if (!matchesRule(trip, request)) throw new AppError('This trip and request do not match', 400, FILE);

    const { data: delivery, error } = await supabase
      .from('delivery_requests')
      .insert({ trip_id, request_id, delivery_fee: 0, status: 'rejected' })
      .select()
      .single();
    if (error) throw new AppError(error.message, 500, FILE);

    const { data: sender } = await supabase.from('users').select('email, phone').eq('id', request.sender_id).single();
    if (sender) {
      await sendRequestRejectedEmail(sender.email, request.item_name);
      await sendRequestRejectedSms(sender.phone, request.item_name);
    }

    res.status(201).json(delivery);
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function markDelivered(req, res, next) {
  try {
    const { id } = req.params;
    const { data: delivery, error } = await supabase.from('delivery_requests').select('*').eq('id', id).single();
    if (error || !delivery) throw new AppError('Delivery not found', 404, FILE);
    if (delivery.status !== 'accepted') throw new AppError('Only accepted deliveries can be marked delivered', 400, FILE);

    const { trip, request } = await fetchTripAndRequest(delivery.trip_id, delivery.request_id);
    if (trip.user_id !== req.user.id) throw new AppError('Only the traveller can mark a delivery as delivered', 403, FILE);

    const { error: deliveryUpdateError } = await supabase
      .from('delivery_requests')
      .update({ status: 'delivered' })
      .eq('id', id);
    if (deliveryUpdateError) throw new AppError(deliveryUpdateError.message, 500, FILE);

    const { error: requestUpdateError } = await supabase
      .from('requests')
      .update({ status: 'delivered' })
      .eq('id', delivery.request_id);
    if (requestUpdateError) throw new AppError(requestUpdateError.message, 500, FILE);

    await adjustTrustScore(trip.user_id, 2);
    await adjustTrustScore(request.sender_id, 1);

    const { data: sender } = await supabase.from('users').select('email, phone').eq('id', request.sender_id).single();
    const { data: traveller } = await supabase.from('users').select('email, phone').eq('id', trip.user_id).single();
    if (sender) {
      await sendDeliveryCompletedEmail(sender.email, request.item_name);
      await sendDeliveryCompletedSms(sender.phone, request.item_name);
    }
    if (traveller) {
      await sendDeliveryCompletedEmail(traveller.email, request.item_name);
      await sendDeliveryCompletedSms(traveller.phone, request.item_name);
    }

    res.json({ message: 'Delivery marked as completed' });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function cancelAcceptedDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const { data: delivery, error } = await supabase.from('delivery_requests').select('*').eq('id', id).single();
    if (error || !delivery) throw new AppError('Delivery not found', 404, FILE);
    if (delivery.status !== 'accepted') throw new AppError('Only accepted deliveries can be cancelled', 400, FILE);

    const { trip, request } = await fetchTripAndRequest(delivery.trip_id, delivery.request_id);

    let cancelledBy;
    if (trip.user_id === req.user.id) {
      cancelledBy = 'traveller';
    } else if (request.sender_id === req.user.id) {
      cancelledBy = 'sender';
    } else {
      throw new AppError('You are not part of this delivery', 403, FILE);
    }

    const { error: deliveryUpdateError } = await supabase
      .from('delivery_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (deliveryUpdateError) throw new AppError(deliveryUpdateError.message, 500, FILE);

    const { error: requestUpdateError } = await supabase
      .from('requests')
      .update({ status: 'pending' })
      .eq('id', delivery.request_id);
    if (requestUpdateError) throw new AppError(requestUpdateError.message, 500, FILE);

    if (cancelledBy === 'traveller') {
      await adjustTrustScore(trip.user_id, -5);
    } else {
      await adjustTrustScore(request.sender_id, -5);
    }

    res.json({ message: `Delivery cancelled by ${cancelledBy}` });
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}

export async function getMyDeliveries(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: myTrips } = await supabase.from('trips').select('id').eq('user_id', userId);
    const { data: myRequests } = await supabase.from('requests').select('id').eq('sender_id', userId);

    const tripIds = (myTrips || []).map((t) => t.id);
    const requestIds = (myRequests || []).map((r) => r.id);

    if (tripIds.length === 0 && requestIds.length === 0) return res.json([]);

    const orFilters = [];
    if (tripIds.length) orFilters.push(`trip_id.in.(${tripIds.join(',')})`);
    if (requestIds.length) orFilters.push(`request_id.in.(${requestIds.join(',')})`);

    const { data: deliveries, error } = await supabase
      .from('delivery_requests')
      .select('*')
      .or(orFilters.join(','))
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500, FILE);

    const enriched = await Promise.all(
      deliveries.map(async (delivery) => {
        const { trip, request } = await fetchTripAndRequest(delivery.trip_id, delivery.request_id);
        const isTraveller = trip.user_id === userId;
        const contactRevealed = delivery.status === 'accepted' || delivery.status === 'delivered';

        let otherParty = null;
        if (contactRevealed) {
          const otherUserId = isTraveller ? request.sender_id : trip.user_id;
          const { data: other } = await supabase
            .from('users')
            .select('name, phone, upi_id')
            .eq('id', otherUserId)
            .single();
          otherParty = other || null;
        }

        return { ...delivery, trip, request, role: isTraveller ? 'traveller' : 'sender', otherParty };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error.isAppError ? error : new AppError(error.message, 500, FILE));
  }
}
