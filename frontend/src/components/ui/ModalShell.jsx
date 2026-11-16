import { useEffect, useRef } from 'react';

// Casca visual dos modais (fundo escuro + painel animado). O conteúdo vem em children.
// titleId: id do <h2> do modal, para o leitor de tela anunciar o título (aria-labelledby).
export function ModalShell({ visible, onClose, size = 'lg', titleId, children }) {
  const width = size === 'sm' ? 'max-w-sm' : 'max-w-lg';
  const panelRef = useRef(null);

  // Ao abrir, o foco vai para o painel (não para o 1º campo: no celular isso abriria o teclado)
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  // Mantém o Tab dentro do modal
  function handleKeyDown(e) {
    if (e.key !== 'Tab' || !panelRef.current) return;

    const nodes = panelRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Com o teclado do celular aberto, leva o campo focado para o centro da área visível
  function handleFocus(e) {
    const el = e.target;
    if (el.matches?.('input, textarea, select')) {
      setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center
                  transition-opacity duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ outline: 'none' }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={`bg-white w-full ${width} rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]
                    max-h-[95dvh] overflow-y-auto overscroll-contain
                    shadow-2xl transition-all duration-300 ease-out
                    ${visible ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95'}`}
      >
        {children}
      </div>
    </div>
  );
}