const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { productMatchesFilters } = require('../utils/productFilterUtils');

/** Ensure the authenticated seller has a Shop; auto-create an empty one if missing. */
async function getOrCreateShop(user) {
  let shop = await Shop.findOne({ owner: user._id });
  if (!shop) {
    shop = await Shop.create({
      owner: user._id,
      name: `${user.name}'s Shop`,
      description: '',
    });
  }
  return shop;
}

// GET /api/products  (public) — paginated, searchable, filterable
const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(500, parseInt(req.query.limit, 10) || 12);
  const skip = (page - 1) * limit;

  const filter = { isPublished: true };

  // The seller dashboard explicitly asks for its own products via ?mine=true
  // (including unpublished ones). Without that flag /products stays public, so
  // a logged-in seller still sees the full storefront on Home/Regional/Listing.
  if (req.query.mine === 'true' && req.user && req.user.role === 'seller') {
    delete filter.isPublished;
    filter.seller = req.user._id;
  }

  if (req.query.region && req.query.region !== 'all') {
    filter.region = req.query.region;
  }

  if (req.query.category && req.query.category !== 'all') {
    filter.category = req.query.category;
  }
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  const sizeFilter = req.query.size ? String(req.query.size).split(',').filter(Boolean) : [];
  const colorFilter = req.query.colorFamilies
    ? String(req.query.colorFamilies).split(',').filter(Boolean)
    : [];
  const seasonFilter = req.query.seasons ? String(req.query.seasons).split(',').filter(Boolean) : [];

  let items = await Product.find(filter).sort({ createdAt: -1 }).lean({ virtuals: true });

  if (sizeFilter.length || colorFilter.length || seasonFilter.length) {
    items = items.filter((product) =>
      productMatchesFilters(product, {
        sizes: sizeFilter,
        colorFamilies: colorFilter,
        seasons: seasonFilter,
      })
    );
  }

  const total = items.length;
  const paged = items.slice(skip, skip + limit);

  // Frontend setProducts expects a plain array; pagination meta is exposed via headers.
  res.set('X-Total-Count', String(total));
  res.set('X-Page', String(page));
  res.json(paged.map(withId));
});

function resolveImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('/uploads/')) {
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}${imagePath}`;
  }
  return imagePath;
}

// Normalize a lean() doc to have an `id` field for the frontend.
function withId(doc) {
  if (doc && doc._id && !doc.id) {
    doc.id = doc._id;
    delete doc._id;
    delete doc.__v;
  }
  if (doc && doc.image) {
    doc.image = resolveImageUrl(doc.image);
  }
  return doc;
}

// GET /api/products/:id  (public)
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('shop', 'name logo rating')
    .populate('seller', 'name email');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const doc = product.toJSON();
  doc.image = resolveImageUrl(doc.image);
  res.json(doc);
});

// POST /api/products  (seller)
const createProduct = asyncHandler(async (req, res) => {
  const shop = await getOrCreateShop(req.user);
  const body = req.body || {};

  const product = await Product.create({
    name: body.name,
    description: body.description || body.name,
    price: Number(body.price) || 0,
    discountPrice: body.discountPrice ? Number(body.discountPrice) : null,
    stock: Number(body.stock) || 0,
    image: body.image || '',
    images: Array.isArray(body.images) ? body.images : [],
    category: body.category || '',
    region: body.region,
    culture: body.culture,
    colorFamilies: Array.isArray(body.colorFamilies) ? body.colorFamilies : [],
    seasons: Array.isArray(body.seasons) ? body.seasons : [],
    variants: Array.isArray(body.variants) ? body.variants : [],
    seller: req.user._id,
    shop: shop._id,
    sellerName: shop.name,
    rating: Number(body.rating) || 0,
  });

  const doc = product.toJSON();
  doc.image = resolveImageUrl(doc.image);
  res.status(201).json(doc);
});

// PUT /api/products/:id  (seller owner or admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only edit your own products');
  }

  // Strip local host prefix from image URL if present
  if (req.body.image && typeof req.body.image === 'string') {
    const port = process.env.PORT || 5000;
    const localPrefix = `http://localhost:${port}`;
    if (req.body.image.startsWith(localPrefix)) {
      req.body.image = req.body.image.slice(localPrefix.length);
    }
  }

  const editable = [
    'name', 'description', 'price', 'discountPrice', 'stock',
    'image', 'images', 'category', 'region', 'culture', 'colorFamilies', 'seasons',
    'variants', 'isPublished',
  ];
  editable.forEach((key) => {
    if (req.body[key] !== undefined) product[key] = req.body[key];
  });

  await product.save();
  const doc = product.toJSON();
  doc.image = resolveImageUrl(doc.image);
  res.json(doc);
});

// DELETE /api/products/:id  (seller owner or admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only delete your own products');
  }
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrCreateShop,
};
