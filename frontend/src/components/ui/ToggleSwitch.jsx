// Interruptor liga/desliga acessível (role="switch")
export function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      // before: amplia a área de toque (44px) sem mudar o desenho do interruptor
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors duration-200 hover:cursor-pointer
                  before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-['']
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200
                    ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}