import { BadRequestException } from '@nestjs/common';

export function JsonString(value) {
  if (!value) return undefined;
  try {
    const valueData = typeof value === 'string' ? JSON.parse(value) : value;
    return valueData;
  } catch (e) {
    throw new BadRequestException(`Invalid JSON string: ${e.message}`);
  }
}

export const areArraysEqual = (
  a: string[] | number[],
  b: string[] | number[],
) => {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, index) => val === sortedB[index]);
};

export function logger(title: string, log: any) {
  if (process.env['LOGGER'] == 'true') {
    console.log(`${title}: `, log);
  }
}

export function generateReceiptNo(): string {
  const now = new Date();
  const datePart = now
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14); // e.g. 20250831123045
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCPT-${datePart}-${randomPart}`;
}
