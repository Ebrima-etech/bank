export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GMD',
  }).format(num);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    verified: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    synced: 'text-green-600 bg-green-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
};

export const generateReference = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REF${timestamp}${random}`;
};

export const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const obj: Record<string, string> = {};
    const values = lines[i].split(',').map(v => v.trim());

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    data.push(obj);
  }

  return data;
};
