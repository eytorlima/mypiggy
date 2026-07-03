import { useState } from 'react';
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
}) {
  const isSmall = size === 'sm';
  const isPassword = type === 'password';
  const canTogglePassword = isPassword && allowPasswordToggle;

  const [showPassword, setShowPassword] = useState(false);

  const inputType = canTogglePassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-0.5 w-full">
      {label && (
        <label className={`font-medium text-white ${isSmall ? 'text-xs' : 'text-sm'}`}>
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
        {icon && <span className="text-gray-400">{icon}</span>}

        <input
          type={inputType}
          placeholder={placeholder}
          {...register}
          className={`flex-1 outline-none text-black bg-white ${isSmall ? 'text-xs' : 'text-sm'}`}
        />

        {canTogglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? (
              <VisibilityOffOutlined fontSize="small" className="hover:cursor-pointer" />
            ) : (
              <VisibilityOutlined fontSize="small" className="hover:cursor-pointer" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className={`text-red-700 ${isSmall ? 'text-xs leading-tight' : 'text-xs'}`}>
          {error}
        </p>
      )}
    </div>
  );
}