export function venmoChargeUrl(handle: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    txn: 'charge',
    recipients: handle.replace(/^@/, ''),
    amount: amount.toFixed(2),
    note,
  });
  return `https://venmo.com/?${params.toString()}`;
}
