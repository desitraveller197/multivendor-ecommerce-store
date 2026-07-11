const asyncHandler = require('../utils/asyncHandler');
const Discount = require('../models/Discount');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/** The price a product sells at once a single discount is applied (never below 0). */
function priceAfter(price, discount) {
  const result =
    discount.type === 'percentage'
      ? price * (1 - discount.value / 100)
      : price - discount.value;
  return Math.max(0, Math.round(result));
}

/** Is the discount currently in effect (active and within its optional date window)? */
function isLive(discount, now = new Date()) {
  if (!discount.active) return false;
  if (discount.startsAt && discount.startsAt > now) return false;
  if (discount.endsAt && discount.endsAt < now) return false;
  return true;
}

/** Does a live discount apply to a given product? */
function applies(discount, product) {
  if (discount.scope === 'shop') return true;
  if (discount.scope === 'category') {
    return String(discount.category || '').trim().toLowerCase() === String(product.category || '').trim().toLowerCase();
  }
  if (discount.scope === 'product') return String(discount.product) === String(product._id);
  return false;
}

/**
 * Recompute `discountPrice` for every product in the seller's shop from scratch,
 * based on all of the seller's currently-live discounts. The best (lowest) price
 * wins when several discounts overlap; products with no applicable discount are
 * reset to null. Storefront reads `product.discountPrice` directly, so this keeps
 * prices consistent no matter how discounts are added, edited or removed.
 */
async function recomputeShopDiscounts(sellerId) {
  const [products, discounts] = await Promise.all([
    Product.find({ seller: sellerId }),
    Discount.find({ seller: sellerId }),
  ]);
  const live = discounts.filter((d) => isLive(d));

  const ops = products.map((product) => {
    let best = null;
    let winningEvent = '';
    live.forEach((d) => {
      if (!applies(d, product)) return;
      const candidate = priceAfter(product.price, d);
      if (candidate < product.price && (best === null || candidate < best)) {
        best = candidate;
        winningEvent = d.name || d.event || '';
      }
    });
    return {
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { discountPrice: best, discountEvent: winningEvent } }, // null/empty clears any previous discount
      },
    };
  });

  if (ops.length) await Product.bulkWrite(ops);
}

// GET /api/seller/discounts  (seller)
const listDiscounts = asyncHandler(async (req, res) => {
  const discounts = await Discount.find({ seller: req.user._id })
    .populate('product', 'name price')
    .sort({ createdAt: -1 });
  res.json(discounts);
});

// POST /api/seller/discounts  (seller)
const createDiscount = asyncHandler(async (req, res) => {
  const { scope, type = 'percentage', value, name = '', startsAt, endsAt } = req.body || {};

  if (!['product', 'category', 'shop'].includes(scope)) {
    res.status(400);
    throw new Error('scope must be product, category or shop');
  }
  const numValue = Number(value);
  if (!Number.isFinite(numValue) || numValue <= 0) {
    res.status(400);
    throw new Error('Discount value must be greater than 0');
  }
  if (type === 'percentage' && numValue > 100) {
    res.status(400);
    throw new Error('Percentage discount cannot exceed 100');
  }

  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    res.status(400);
    throw new Error('Create your shop before adding discounts');
  }

  const data = {
    seller: req.user._id,
    shop: shop._id,
    name,
    scope,
    type,
    value: numValue,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
    event: req.body.event || '',
  };

  if (scope === 'product') {
    const product = await Product.findOne({ _id: req.body.product, seller: req.user._id });
    if (!product) {
      res.status(400);
      throw new Error('Select one of your own products');
    }
    data.product = product._id;
  } else if (scope === 'category') {
    if (!req.body.category) {
      res.status(400);
      throw new Error('Select a category');
    }
    data.category = req.body.category;
  }

  const discount = await Discount.create(data);
  await recomputeShopDiscounts(req.user._id);
  const populated = await discount.populate('product', 'name price');
  res.status(201).json(populated);
});

// PATCH /api/seller/discounts/:id  (seller owner)
const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findOne({ _id: req.params.id, seller: req.user._id });
  if (!discount) {
    res.status(404);
    throw new Error('Discount not found');
  }

  const editable = ['name', 'type', 'value', 'active', 'startsAt', 'endsAt', 'event'];
  editable.forEach((key) => {
    if (req.body[key] !== undefined) discount[key] = req.body[key];
  });
  if (req.body.value !== undefined) {
    const numValue = Number(req.body.value);
    if (!Number.isFinite(numValue) || numValue <= 0) {
      res.status(400);
      throw new Error('Discount value must be greater than 0');
    }
    if (discount.type === 'percentage' && numValue > 100) {
      res.status(400);
      throw new Error('Percentage discount cannot exceed 100');
    }
    discount.value = numValue;
  }

  await discount.save();
  await recomputeShopDiscounts(req.user._id);
  const populated = await discount.populate('product', 'name price');
  res.json(populated);
});

// DELETE /api/seller/discounts/:id  (seller owner)
const deleteDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findOne({ _id: req.params.id, seller: req.user._id });
  if (!discount) {
    res.status(404);
    throw new Error('Discount not found');
  }
  await discount.deleteOne();
  await recomputeShopDiscounts(req.user._id);
  res.json({ message: 'Discount removed' });
});

module.exports = {
  listDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  recomputeShopDiscounts,
};
