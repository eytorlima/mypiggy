import { useId, useState } from 'react';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';

export function ModalField({
  label,
  type = 'text',
  register,
  error,
  autoComplete,
  placeholder,
  maxLength,
  inputMode,
  readOnly,
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...register}
          className={`h-10 w-full rounded-lg border px-3 text-sm text-black bg-white outline-none shadow-xs
                      transition-colors focus:border-primary-700 ${isPassword ? 'pr-11' : ''}
                      ${error ? 'border-2 border-red-700' : 'border-gray-300'}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center
                       text-gray-500 hover:text-gray-700 hover:cursor-pointer"
          >
            {showPassword
              ? <VisibilityOffOutlined fontSize="small" aria-hidden="true" />
              : <VisibilityOutlined fontSize="small" aria-hidden="true" />}
          </button>
        )}
      </div>

      {error && <p id={errorId} className="text-xs text-red-700">{error}</p>}
    </div>
  );
}