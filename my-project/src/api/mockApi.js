/** Set `VITE_USE_MOCK=false` in `.env` to use the real API and Stripe Elements on checkout. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const delay = (ms = 500) => new Promise((res) => setTimeout(res, ms))
