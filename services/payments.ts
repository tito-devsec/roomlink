// Client-side payment helper. This file never decides whether a payment
// succeeded — it asks the backend to start a mobile-money charge and polls
// the backend for the result. The gateway's webhook tells the backend the truth.

import { Config, computeServiceFee } from '../constants/Config';

export type PaymentNetwork = 'mpesa' | 'tigo' | 'airtel' | 'halopesa';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface ServiceCharge {
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: 'TZS';
}

export interface CreateChargeInput {
  bookingId: string;
  hostelId: string;
  monthlyRent: number;
  phone: string;
  network: PaymentNetwork;
  userId?: string;
}

const BASE = Config.API_BASE_URL.replace(/\/$/, '');

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('255')) return digits;
  if (digits.startsWith('0')) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;
  return digits;
}

export function isValidTzPhone(input: string): boolean {
  return /^255(6|7)\d{8}$/.test(normalizePhone(input));
}

export async function createServiceCharge(input: CreateChargeInput): Promise<ServiceCharge> {
  const amount = computeServiceFee(input.monthlyRent);
  const data = await api('/api/payments/create-charge', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: input.bookingId,
      hostelId: input.hostelId,
      monthlyRent: input.monthlyRent,
      amount,
      currency: 'TZS',
      phone: normalizePhone(input.phone),
      network: input.network,
      userId: input.userId,
    }),
  });
  return data as ServiceCharge;
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  const data = await api(`/api/payments/${paymentId}/status`);
  return data.status as PaymentStatus;
}

export async function pollUntilResolved(
  paymentId: string,
  onTick?: (status: PaymentStatus, attempt: number) => void,
  tries = 24,
  intervalMs = 5000,
): Promise<PaymentStatus> {
  for (let i = 0; i < tries; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    let status: PaymentStatus = 'pending';
    try { status = await getPaymentStatus(paymentId); } catch {}
    onTick?.(status, i + 1);
    if (status === 'completed' || status === 'failed' || status === 'cancelled') return status;
  }
  return 'pending';
}
