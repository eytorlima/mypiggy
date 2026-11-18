import { useEffect, useState } from 'react';

// Contador compartilhado: se dois modais abrirem juntos, a rolagem só volta quando o último fechar
let scrollLocks = 0;

function lockScroll() {
  if (scrollLocks++ === 0) document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  if (--scrollLocks === 0) document.body.style.overflow = '';
}

// Animação de entrada/saída + fechar com ESC, igual aos outros modais do projeto.
// Também trava a rolagem do fundo e devolve o foco ao elemento que abriu o modal.
// mounted: está no DOM | visible: está na posição final (dispara a transição CSS)
export function useModalTransition(open, onClose) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Trava a rolagem do fundo e restaura o foco ao fechar
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    lockScroll();
    return () => {
      unlockScroll();
      if (previous && previous.isConnected) previous.focus?.({ preventScroll: true });
    };
  }, [open]);

  return { mounted, visible };
}