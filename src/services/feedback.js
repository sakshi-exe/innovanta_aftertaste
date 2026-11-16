import { supabase, supabaseConfigured } from '../lib/supabase.js';

export async function submitFeedback(feedback) {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      'Feedback saving is not configured yet. Add your Supabase URL and publishable key, then try again.',
    );
  }

  const { error } = await supabase.from('feedback').insert({
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
  });

  if (error) {
    console.error('Unable to submit feedback:', error);
    throw new Error(
      'We couldn’t save your note just now. Please check your connection and try again.',
    );
  }
}
