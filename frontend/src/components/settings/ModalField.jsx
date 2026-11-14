export function ModalField({ label, type = 'text', register, error, autoComplete, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        {...register}
        className={`h-10 rounded-lg border px-3 text-sm text-black bg-white outline-none shadow-xs
                    transition-colors focus:border-primary-700
                    ${error ? 'border-2 border-red-700' : 'border-gray-300'}`}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}