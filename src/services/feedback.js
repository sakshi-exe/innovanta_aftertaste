import { supabase, supabaseConfigured } from '../lib/supabase.js';

export async function submitFeedback(feedback) {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      'Feedback saving is not configured yet. Add your Supabase URL and publishable key, then try again.',
    );
  }

  let response;
  try {
    response = await supabase.from('feedback').insert({
      full_name: feedback.fullName.trim(),
      college: feedback.college.trim() || null,
      email: feedback.email.trim() || null,
      rating: feedback.rating,
      favorite_parts: feedback.favoriteParts,
      learning_takeaway: feedback.learningTakeaway.trim() || null,
      event_description: feedback.eventDescription.trim(),
      future_attendance: feedback.futureAttendance,
      feedback_message: feedback.feedbackMessage.trim(),
      testimonial_consent: feedback.testimonialConsent === 'yes',
      name_display_consent:
        feedback.testimonialConsent === 'yes' && feedback.nameDisplayConsent === 'yes',
    }, { count: 'exact' });
  } catch (requestError) {
    console.error('Feedback insert request failed:', {
      code: requestError?.code,
      status: requestError?.status,
    });
    throw new Error(
      'We couldn’t save your note just now. Please check your connection and try again.',
    );
  }

  if (
    !response
    || response.error
    || typeof response.status !== 'number'
    || response.status < 200
    || response.status >= 300
    || response.count !== 1
  ) {
    console.error('Feedback insert was rejected:', {
      code: response?.error?.code,
      status: response?.error?.status ?? response?.status,
      insertedRows: response?.count,
    });
    throw new Error(
      'We couldn’t save your note just now. Please check your connection and try again.',
    );
  }
}
