const express = require('express');
const crypto = require('crypto');
const store = require('../store');
const provider = require('../providers');
const router = express.Router();
const FEE_RATE = Number(process.env.SERVICE_FEE_RATE || 0.40);
const newId = () => `pay_${crypto.randomBytes(9).toString('hex')}`;
const normalizePhone = (s = '') => { const d = String(s).replace(/\D/g, ''); if (d.startsWith('255')) return d; if (d.startsWith('0')) return `255${d.slice(1)}`; if (d.length === 9) return `255${d}`; return d; };

router.post('/create-charge', async (req, res) => {
  try {
    const { bookingId, hostelId, userId, monthlyRent, network } = req.body || {};
    const phone = normalizePhone(req.body?.phone);
    if (!bookingId || !hostelId) return res.status(400).json({ error: 'Missing booking or hostel.' });
    if (!/^255(6|7)\d{8}$/.test(phone)) return res.status(400).json({ error: 'Invalid Tanzanian mobile number.' });
    const rent = Number(monthlyRent);
    if (!rent || rent <= 0) return res.status(400).json({ error: 'Invalid monthly rent.' });
    const amount = Math.round(rent * FEE_RATE);
    if (amount <= 0) return res.status(400).json({ error: 'Computed fee is zero.' });
    const id = newId();
    await store.createPayment({ id, bookingId, hostelId, userId, amount, currency: 'TZS', network: network || 'mpesa', phone, status: 'pending', provider: process.env.PAYMENT_PROVIDER || 'mock' });
    const callbackUrl = `${(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/api/payments/webhook`;
    const { externalRef, status } = await provider.requestUssdPush({ amount, currency: 'TZS', phone, network: network || 'mpesa', reference: id, callbackUrl });
    await store.updateStatus(id, status, externalRef);
    res.json({ paymentId: id, status, amount, currency: 'TZS' });
  } catch (e) { console.error('[create-charge]', e.message); res.status(502).json({ error: 'Could not start the payment. Try again.' }); }
});

router.post('/webhook', async (req, res) => {
  try {
    const { externalRef, status } = provider.verifyWebhook(req);
    if (!externalRef) return res.status(400).json({ error: 'no reference' });
    const payment = await store.findByExternalRef(externalRef) || await store.getPayment(externalRef.replace(/^mock_/, ''));
    if (!payment) return res.status(404).json({ error: 'unknown payment' });
    if (payment.status === 'pending') await store.updateStatus(payment.id, status, externalRef);
    res.json({ ok: true });
  } catch (e) { console.error('[webhook]', e.message); res.status(401).json({ error: 'rejected' }); }
});

router.get('/:id/status', async (req, res) => {
  const p = await store.getPayment(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json({ status: p.status, amount: p.amount, currency: p.currency });
});

router.get('/', async (_req, res) => { res.json({ payments: await store.listPayments(200) }); });
module.exports = router;
