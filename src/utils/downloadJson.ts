/** Saves `data` as a JSON file through a temporary link, entirely in the browser. */
export function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked on the next tick: some browsers start the download only after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
