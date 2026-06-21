/**
 * Pakistani payment-gateway helpers (JazzCash + Easypaisa).
 *
 * Both gateways use a *hosted-checkout redirect*: we hand the browser a signed
 * set of form fields, it POSTs to the gateway, the customer pays on the
 * gateway's page, and the gateway redirects back to our return URL with a
 * signed result that we verify here.
 *
 * When a gateway's credentials are not configured (e.g. local dev), callers
 * fall back to a simulated flow so the app still works end-to-end. Set the env
 * vars below to go live against the sandbox/production endpoints.
 *
 *   JazzCash:  JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT,
 *              JAZZCASH_POST_URL (defaults to sandbox)
 *   Easypaisa: EASYPAISA_STORE_ID, EASYPAISA_HASH_KEY,
 *              EASYPAISA_POST_URL (defaults to sandbox)
 */
const crypto = require('crypto');

function pad(n) {
  return String(n).padStart(2, '0');
}

/** yyyymmddHHMMSS — the timestamp format both gateways expect. */
function formatDateTime(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

// ───────────────────────────── JazzCash ─────────────────────────────

function jazzcashConfig() {
  return {
    merchantId: process.env.JAZZCASH_MERCHANT_ID || '',
    password: process.env.JAZZCASH_PASSWORD || '',
    integritySalt: process.env.JAZZCASH_INTEGRITY_SALT || '',
    postUrl:
      process.env.JAZZCASH_POST_URL ||
      'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
  };
}

/**
 * JazzCash secure hash: HMAC-SHA256 over the non-empty pp_* / ppmpf_* values,
 * sorted by key and joined with '&', prefixed with the integrity salt. The key
 * for the HMAC is the integrity salt itself.
 */
function jazzcashSecureHash(fields, salt) {
  const values = Object.keys(fields)
    .filter((k) => k.startsWith('pp_') || k.startsWith('ppmpf_'))
    .filter((k) => k !== 'pp_SecureHash')
    .filter((k) => fields[k] !== '' && fields[k] != null)
    .sort()
    .map((k) => fields[k]);
  const message = `${salt}&${values.join('&')}`;
  return crypto.createHmac('sha256', salt).update(message).digest('hex').toUpperCase();
}

function buildJazzCashRequest({ amountPkr, txnRef, description, returnUrl }) {
  const cfg = jazzcashConfig();
  const now = new Date();
  const fields = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: cfg.merchantId,
    pp_Password: cfg.password,
    pp_TxnRefNo: txnRef,
    pp_Amount: String(Math.round(amountPkr * 100)), // amount in paisa
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatDateTime(now),
    pp_BillReference: txnRef,
    pp_Description: description || 'Order payment',
    pp_TxnExpiryDateTime: formatDateTime(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    pp_ReturnURL: returnUrl,
    pp_SecureHash: '',
    ppmpf_1: '1',
  };
  fields.pp_SecureHash = jazzcashSecureHash(fields, cfg.integritySalt);
  return { postUrl: cfg.postUrl, fields };
}

/** Verify a JazzCash return payload. Response code '000' = successful payment. */
function verifyJazzCashResponse(body) {
  const cfg = jazzcashConfig();
  const expected = jazzcashSecureHash(body, cfg.integritySalt);
  const received = String(body.pp_SecureHash || '').toUpperCase();
  return {
    valid: expected === received,
    success: String(body.pp_ResponseCode) === '000',
    txnRef: body.pp_TxnRefNo,
  };
}

// ───────────────────────────── Easypaisa ─────────────────────────────

function easypaisaConfig() {
  return {
    storeId: process.env.EASYPAISA_STORE_ID || '',
    hashKey: process.env.EASYPAISA_HASH_KEY || '',
    postUrl:
      process.env.EASYPAISA_POST_URL ||
      'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
  };
}

/**
 * Easypaisa encrypts the request string with AES-128-ECB using the 16-char
 * merchant hash key, base64-encoded. NOTE: confirm the exact field set with
 * your Easypaisa merchant onboarding docs before going live.
 */
function easypaisaEncrypt(plaintext, hashKey) {
  const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(hashKey, 'utf8'), null);
  return cipher.update(plaintext, 'utf8', 'base64') + cipher.final('base64');
}

function buildEasypaisaRequest({ amountPkr, orderRef, returnUrl }) {
  const cfg = easypaisaConfig();
  const now = new Date();
  const params = {
    amount: amountPkr.toFixed(1),
    expiryDate: formatDateTime(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    orderRefNum: orderRef,
    paymentMethod: 'MA_PAYMENT_METHOD',
    postBackURL: returnUrl,
    storeId: cfg.storeId,
  };
  const plaintext = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const merchantHashedReq = easypaisaEncrypt(plaintext, cfg.hashKey);
  return { postUrl: cfg.postUrl, fields: { ...params, merchantHashedReq, autoRedirect: '1' } };
}

/** Easypaisa returns desc/status against the order ref. '0000' = success. */
function verifyEasypaisaResponse(body) {
  return {
    valid: true, // Easypaisa returns are matched by orderRefNum; no signed hash on return.
    success: String(body.status || body.responseCode) === '0000',
    txnRef: body.orderRefNumber || body.orderRefNum,
  };
}

// ───────────────────────────── Dispatch ─────────────────────────────

function isConfigured(method) {
  if (method === 'JazzCash') {
    const c = jazzcashConfig();
    return Boolean(c.merchantId && c.password && c.integritySalt);
  }
  if (method === 'Easypaisa') {
    const c = easypaisaConfig();
    return Boolean(c.storeId && c.hashKey && c.hashKey.length === 16);
  }
  return false;
}

function buildRequest(method, args) {
  if (method === 'JazzCash') return buildJazzCashRequest(args);
  if (method === 'Easypaisa') return buildEasypaisaRequest(args);
  throw new Error(`Unsupported gateway: ${method}`);
}

function verifyResponse(method, body) {
  if (method === 'JazzCash') return verifyJazzCashResponse(body);
  if (method === 'Easypaisa') return verifyEasypaisaResponse(body);
  return { valid: false, success: false, txnRef: null };
}

module.exports = {
  isConfigured,
  buildRequest,
  verifyResponse,
  formatDateTime,
};
