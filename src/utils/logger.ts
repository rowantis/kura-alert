import { getKSTTime } from './utils';

export function logWithTime(...args: any[]) {
  const kstTime = getKSTTime();
  console.log(`[${kstTime}] ${args}`);
}
export function errorWithTime(...args: any[]) {
  const kstTime = getKSTTime();
  console.error(`[${kstTime}] ${args}`);
}

export function warnWithTime(...args: any[]) {
  const kstTime = getKSTTime();
  console.warn(`[${kstTime}] ${args}`);
}

export function stringifyBigInt(value: any) {
  return JSON.stringify(value, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
}

export function formatData(data: any): string {
  if (typeof data !== 'object' || data === null) {
    return String(data);
  }

  return Object.entries(data)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${key}: ${formatData(value)}`;
      }
      return `${key}: ${value}`;
    })
    .join(', ');
}
