export function generateClientSeed(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function truncateHash(hash: string, chars = 16): string {
  return hash.slice(0, chars) + '…';
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString() ===
    date.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return (
    date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ` at ${time}`
  );
}
