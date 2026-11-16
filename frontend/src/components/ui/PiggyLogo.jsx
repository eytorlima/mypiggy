export function PiggyLogo({ size = 80 }) {
  return (
    <div
      className="rounded-full bg-white flex items-center justify-center shadow-xl shrink-0"
      style={{ width: size, height: size }}
    >
      <img
        // Caminho absoluto: com "./logo.png" a imagem quebra em rotas aninhadas (ex.: /privacy)
        src="/logo.png"
        alt="MyPiggy Logo"
        style={{ width: size * 0.85, height: size * 0.85 }}
      />
    </div>
  );
}