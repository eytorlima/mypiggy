// Casca visual dos modais (fundo escuro + painel animado). O conteúdo vem em children.
export function ModalShell({ visible, onClose, size = 'lg', children }) {
  const width = size === 'sm' ? 'max-w-sm' : 'max-w-lg';

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center
                  transition-opacity duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full ${width} rounded-t-2xl sm:rounded-2xl p-5 max-h-[95vh] overflow-y-auto
                    shadow-2xl transition-all duration-300 ease-out
                    ${visible ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}