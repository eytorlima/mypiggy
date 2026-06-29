import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* Espaço do header fixo */}
      <div className="pt-16 pb-20 flex-1">
        <Outlet />
      </div>

      <BottomNav onFabClick={() => setFabOpen(true)} />

      {/* Modal FAB — placeholder por enquanto */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setFabOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800 mb-2">Nova Transação</h2>
            <p className="text-sm text-gray-400">Em construção — Sprint 2.</p>
            <button
              onClick={() => setFabOpen(false)}
              className="mt-4 w-full py-2 rounded-lg bg-primary-500 text-white font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}