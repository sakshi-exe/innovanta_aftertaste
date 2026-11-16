import React from 'react';

export default function ConsentChoice({ error, label, name, onChange, value }) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} className="field-group consent-choice" id={`${name}-group`}>
      <legend>{label} <span className="required-mark">*</span></legend>
      <div className="choice-row">
        {[['yes', 'Yes'], ['no', 'No']].map(([choice, text]) => (
          <label className={`choice-pill${value === choice ? ' is-selected' : ''}`} key={choice}>
            <input aria-invalid={Boolean(error)} checked={value === choice} name={name} onChange={() => onChange(choice)} type="radio" />
            <span className="choice-indicator" />{text}
          </label>
        ))}
      </div>
      {error && <span className="field-error" id={`${name}-error`} role="alert">{error}</span>}
    </fieldset>
  );
}
