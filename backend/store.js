const useMysql = !!process.env.DB_HOST;
let pool = null;
const mem = new Map();
if (useMysql) {
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10 });
  console.log('[store] using MySQL');
} else { console.log('[store] using in-memory store (dev only — set DB_HOST for MySQL)'); }

async function createPayment(p) {
  if (useMysql) {
    await pool.execute(`INSERT INTO payments (id,booking_id,hostel_id,user_id,amount,currency,network,phone,status,provider,external_ref,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [p.id,p.bookingId,p.hostelId,p.userId||null,p.amount,p.currency,p.network,p.phone,p.status,p.provider,p.externalRef||null]);
  } else { mem.set(p.id, { ...p, created_at: new Date().toISOString() }); }
  return p;
}
async function getPayment(id) {
  if (useMysql) { const [r] = await pool.execute(`SELECT * FROM payments WHERE id=? LIMIT 1`, [id]); return r[0] || null; }
  return mem.get(id) || null;
}
async function findByExternalRef(ref) {
  if (useMysql) { const [r] = await pool.execute(`SELECT * FROM payments WHERE external_ref=? LIMIT 1`, [ref]); return r[0] || null; }
  for (const v of mem.values()) if (v.externalRef === ref) return v; return null;
}
async function updateStatus(id, status, externalRef) {
  if (useMysql) {
    await pool.execute(`UPDATE payments SET status=?, external_ref=COALESCE(?,external_ref), updated_at=NOW() WHERE id=?`, [status, externalRef||null, id]);
    if (status === 'completed') {
      // Best-effort: mirror onto a bookings table if one exists. Never let this
      // break payment confirmation (bookings may live in Supabase, not here).
      try {
        await pool.execute(`UPDATE bookings SET status='confirmed', service_fee_paid=TRUE, payment_id=? WHERE id=(SELECT booking_id FROM payments WHERE id=?)`, [id, id]);
      } catch (e) { console.warn('[store] bookings mirror skipped:', e.message); }
    }
  } else { const c = mem.get(id); if (c) mem.set(id, { ...c, status, externalRef: externalRef || c.externalRef }); }
}
async function listPayments(limit = 200) {
  if (useMysql) { const [r] = await pool.execute(`SELECT * FROM payments ORDER BY created_at DESC LIMIT ?`, [String(limit)]); return r; }
  return [...mem.values()].sort((a,b)=>(a.created_at<b.created_at?1:-1)).slice(0,limit);
}
module.exports = { createPayment, getPayment, findByExternalRef, updateStatus, listPayments };
