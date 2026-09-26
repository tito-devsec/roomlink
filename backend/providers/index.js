const PROVIDER = process.env.PAYMENT_PROVIDER || 'mock';
function mockProvider() {
  return {
    async requestUssdPush({ reference, callbackUrl }) {
      const externalRef = `mock_${reference}`;
      setTimeout(async () => {
        try {
          await fetch(callbackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-webhook-secret': process.env.PAYMENT_WEBHOOK_SECRET || 'change-me' }, body: JSON.stringify({ reference: externalRef, status: 'success' }) });
        } catch (e) { console.error('[mock] callback failed:', e.message); }
      }, 6000);
      return { externalRef, status: 'pending' };
    },
    verifyWebhook(req) {
      if ((req.headers['x-webhook-secret'] || '') !== (process.env.PAYMENT_WEBHOOK_SECRET || 'change-me')) throw new Error('bad webhook secret');
      const { reference, status } = req.body || {};
      return { externalRef: reference, status: status === 'success' ? 'completed' : 'failed' };
    },
  };
}
const AZ = { mpesa: 'Mpesa', tigo: 'Tigo', airtel: 'Airtel', halopesa: 'Halopesa' };
function azampayProvider() {
  const base = (process.env.AZAMPAY_BASE_URL || '').replace(/\/$/, '');
  const token = process.env.AZAMPAY_TOKEN;
  return {
    async requestUssdPush({ amount, currency, phone, network, reference }) {
      const res = await fetch(`${base}/azampay/mno/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountNumber: phone, amount: String(amount), currency, externalId: reference, provider: AZ[network] || 'Mpesa' }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || `AzamPay checkout failed (${res.status})`);
      return { externalRef: data.transactionId || reference, status: 'pending' };
    },
    verifyWebhook(req) {
      if ((req.headers['x-webhook-secret'] || '') !== (process.env.PAYMENT_WEBHOOK_SECRET || '')) throw new Error('bad webhook secret');
      const b = req.body || {};
      const ref = b.externalId || b.utilityref || b.reference;
      const raw = String(b.transactionstatus || b.status || '').toLowerCase();
      const status = ['success','completed','paid'].includes(raw) ? 'completed' : ['failed','cancelled','rejected'].includes(raw) ? 'failed' : 'pending';
      return { externalRef: ref, status };
    },
  };
}
module.exports = PROVIDER === 'azampay' ? azampayProvider() : mockProvider();
