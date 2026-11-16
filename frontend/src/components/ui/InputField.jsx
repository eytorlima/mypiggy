import { useId, useState } from 'react';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';

export function InputField({
  label,
  type = 'text',
  placeholder,
  icon,
  register,
  error,
  size = 'md',
  allowPasswordToggle = false,
  className = '', // cor do texto digitado (ex.: 'text-red-600'); padrão text-black
  id,
  ...rest // maxLength, inputMode, autoComplete, max, min, disabled...
}) {
  const isSmall = size === 'sm';
  const isPassword = type === 'password';
  const canTogglePassword = isPassword && allowPasswordToggle;

  const [showPassword, setShowPassword] = useState(false);

  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  const inputType = canTogglePassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-0.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`font-medium text-white ${isSmall ? 'text-xs' : 'text-sm'}`}
        >
          {label}
        </label>
      )}

      <div
        className={`
          flex items-center gap-2 rounded-lg border bg-white h-[40px]
          ${isSmall ? 'px-2 py-1' : 'px-3 py-2'}
          ${error ? 'border-2 border-red-700' : 'border-gray-300'}
          focus-within:border-primary-700 shadow-md transition-colors
        `}
      >
        {icon && (
          <span className="text-gray-500" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={inputType}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
          {...register}
          // O destaque de foco é a borda do wrapper (focus-within); sem anel duplicado
          style={{ outline: 'none' }}
          className={`flex-1 min-w-0 bg-white ${className || 'text-black'} ${isSmall ? 'text-xs' : 'text-sm'}`}
        />

        {canTogglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            className="-mr-1 w-8 h-8 shrink-0 flex items-center justify-center rounded-full
                       text-gray-500 hover:text-gray-700 transition-colors hover:cursor-pointer"
          >
            {showPassword ? (
              <VisibilityOffOutlined fontSize="small" />
            ) : (
              <VisibilityOutlined fontSize="small" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className={`text-red-700 ${isSmall ? 'text-xs leading-tight' : 'text-xs'}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}