export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

export const formatNumber = (n: number, decimals = 1): string =>
  new Intl.NumberFormat('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const localDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const today = (): string => localDateStr(new Date());

export const startOfMonth = (date = new Date()): string =>
  localDateStr(new Date(date.getFullYear(), date.getMonth(), 1));

export const endOfMonth = (date = new Date()): string =>
  localDateStr(new Date(date.getFullYear(), date.getMonth() + 1, 0));

export const startOfYear = (date = new Date()): string =>
  `${date.getFullYear()}-01-01`;

export const endOfYear = (date = new Date()): string =>
  `${date.getFullYear()}-12-31`;
