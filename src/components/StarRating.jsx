import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value, onChange, error }) {
  return (
    <fieldset className={`field-group rating-group${error ? ' has-error' : ''}`}>
      <legend>Overall experience <span className="required-mark">*</span></legend>
      <div
        aria-describedby={error ? 'rating-error' : undefined}
        aria-label="Overall experience rating"
        aria-required="true"
        className="rating-control"
        role="radiogroup"
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            aria-checked={value === rating}
            aria-label={`${rating} out of 5 stars`}
            className={`rating-button${value >= rating ? ' selected' : ''}`}
            id={`rating-${rating}`}
            key={rating}
            onClick={() => onChange(rating)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                const nextRating = Math.min(5, rating + 1);
                onChange(nextRating);
                document.getElementById(`rating-${nextRating}`)?.focus();
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                const nextRating = Math.max(1, rating - 1);
                onChange(nextRating);
                document.getElementById(`rating-${nextRating}`)?.focus();
              }
            }}
            role="radio"
            tabIndex={value === rating || (!value && rating === 1) ? 0 : -1}
            type="button"
          >
            <Star size={27} fill={value >= rating ? 'currentColor' : 'none'} strokeWidth={1.6} />
          </button>
        ))}
        <span className="rating-caption">{value ? `${value} / 5` : 'Tap to rate'}</span>
      </div>
      {error && <span className="field-error" id="rating-error" role="alert">{error}</span>}
    </fieldset>
  );
}
