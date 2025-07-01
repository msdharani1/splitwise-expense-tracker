export const formatCurrency = (amount: number): string => {
  return `₹${Math.abs(amount).toFixed(0)}`;
};

export const getBalanceColor = (balance: number): string => {
  if (balance > 0) return '#DC2626'; // Red - they owe me
  if (balance < 0) return '#16A34A'; // Green - I owe them
  return '#64748B'; // Gray - even
};

export const getBalanceText = (balance: number): string => {
  if (balance > 0) return `owes you`;
  if (balance < 0) return `you owe`;
  return 'settled';
};