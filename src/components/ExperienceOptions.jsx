import React from 'react';
import { Coffee, Lightbulb, MessageCircle, Sparkles, Users, Zap } from 'lucide-react';

const options = [
  { label: 'The people and networking', icon: Users },
  { label: 'The conversations', icon: MessageCircle },
  { label: 'The speakers and insights', icon: Lightbulb },
  { label: 'The coffee and atmosphere', icon: Coffee },
  { label: 'The activities and experience', icon: Zap },
  { label: 'Everything!', icon: Sparkles },
];

export default function ExperienceOptions({ selected, onChange }) {
  function toggle(label) {
    onChange(selected.includes(label) ? selected.filter((item) => item !== label) : [...selected, label]);
  }

  return (
    <fieldset className="field-group">
      <legend>What did you enjoy the most? <span className="optional-mark">(optional)</span></legend>
      <div className="experience-options">
        {options.map(({ label, icon: Icon }) => (
          <button
            aria-pressed={selected.includes(label)}
            className={`experience-option${selected.includes(label) ? ' is-selected' : ''}`}
            key={label}
            onClick={() => toggle(label)}
            type="button"
          >
            <Icon size={17} strokeWidth={1.7} /><span>{label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
