import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import Stripe from 'stripe'

const PORT = Number(process.env.STRIPE_SERVER_PORT) || 4242
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const app = express()
app.use(express.json({ limit: '512kb' }))
app.use(cors({ origin: CLIENT_URL, credentials: false }))

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    stripeReady: Boolean(stripeSecretKey?.startsWith('sk_')),
    publishableKeyPresent: Boolean(process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY),
  })
})

/** PKR amounts: Stripe expects smallest currency unit (paisa). */
function pkrLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No line items.')
  }
  if (items.length > 80) {
    throw new Error('Too many distinct line items.')
  }

  return items.map((item) => {
    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 499) || 'Product' : 'Product'
    const qty = Number.parseInt(item.quantity, 10)
    const quantity = Number.isFinite(qty) ? Math.min(Math.max(qty, 1), 999) : 1
    const unitPkr = Number(item.unitAmountPkr ?? item.discountPrice ?? item.price)
    if (!Number.isFinite(unitPkr) || unitPkr <= 0) {
      throw new Error(`Invalid price for "${name}".`)
    }
    const unitAmount = Math.round(unitPkr * 100)
    if (unitAmount < 50) {
      throw new Error('Amount below Stripe minimum for this currency.')
    }
    const product_data = {
      name,
      ...(item.id != null ? { metadata: { product_id: String(item.id) } } : {}),
    }

    return {
      quantity,
      price_data: {
        currency: 'pkr',
        product_data,
        unit_amount: unitAmount,
      },
    }
  })
}

app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error:
        'Stripe secret key is missing. Add STRIPE_SECRET_KEY to your .env (Dashboard → Developers → API keys).',
    })
  }

  try {
    const { items } = req.body
    const lineItems = pkrLineItems(items)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/checkout/cancel`,
      billing_address_collection: 'required',
    })

    return res.json({ url: session.url, id: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout session failed.'
    console.error('[stripe-server]', message)
    return res.status(400).json({ error: message })
  }
})

app.listen(PORT, () => {
  console.log(`Stripe API listening on http://localhost:${PORT}`)
  if (!stripeSecretKey) {
    console.warn('Set STRIPE_SECRET_KEY in .env to enable payments.')
  }
})
