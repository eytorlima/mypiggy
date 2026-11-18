// Dispara o download de um Blob no navegador, com o nome de arquivo informado.
export function downloadFile(blob, filename) {
  // Cria uma URL temporária que aponta para o blob na memória
  const url = URL.createObjectURL(blob);

  // O navegador só baixa arquivos via <a download>: criamos um link invisível e clicamos nele
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Libera a memória depois que o download já foi iniciado
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}