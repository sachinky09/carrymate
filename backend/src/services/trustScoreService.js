import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const FILE = 'services/trustScoreService.js';

export async function adjustTrustScore(userId, delta) {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('trust_score')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw new AppError(`Failed to fetch trust score: ${fetchError.message}`, 500, FILE);
  }

  const newScore = Math.max(0, (user.trust_score || 0) + delta);

  const { error: updateError } = await supabase
    .from('users')
    .update({ trust_score: newScore })
    .eq('id', userId);

  if (updateError) {
    throw new AppError(`Failed to update trust score: ${updateError.message}`, 500, FILE);
  }

  return newScore;
}
