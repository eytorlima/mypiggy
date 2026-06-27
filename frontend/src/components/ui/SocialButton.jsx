export function SocialButton({ icon, label, onClick, disabled = false}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center justify-center gap-3
                w-full py-2 px-4 rounded-lg border h-[40px]
                font-medium text-sm transition-all duration-200
                ${disabled 
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' 
                    : 'border-none text-white bg-black hover:bg-gray-800 cursor-pointer'
                }
            `}
        >
            <span className={disabled ? 'opacity-100' : ''}>{icon}</span>
            {label}
        </button>
    );
}