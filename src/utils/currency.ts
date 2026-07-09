export function formatINR(amountPaise: number) {
  const rupees = amountPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function parseINR(value: any) {
  const str = String(value ?? '');
  const onlyDigits = str.replace(/[^\n  0-9.]/g, '');
  const numeric = parseFloat(onlyDigits || '0');
  return Number.isNaN(numeric) ? 0 : Math.round(numeric * 100);
}

export function sumPaise(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
