export function InputField({ label, type = 'text', placeholder, icon, register, error, size = 'md'}) {

    const isSmall = size === 'sm';

    return (
    <div className="flex flex-col gap-0.5 w-full">
      {label && (
        <label className={`font-medium text-white ${isSmall ? 'text-xs' : 'text-sm'}`}>
          {label}
        </label>
      )}
      <div className={`
        flex items-center gap-2 rounded-lg border bg-white h-[40px]
        ${isSmall ? 'px-2 py-1' : 'px-3 py-2'}
        ${error ? 'border-2 border-red-700' : 'border-gray-300'}
        focus-within:border-primary-700 shadow-md transition-colors
      `}>
        {icon && <span className="text-gray-400">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          {...register}
          className={`flex-1 outline-none text-black bg-white ${isSmall ? 'text-xs' : 'text-sm'}`}
        />
      </div>
      {error && (
        <p className="text-red-700 text-xs ${isSmall ? 'text-xs leading-tight' : 'text-xs'}">{error}</p>
      )}
    </div>
  );
}