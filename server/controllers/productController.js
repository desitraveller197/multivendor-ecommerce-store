const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { productMatchesFilters } = require('../utils/productFilterUtils');
const xlsx = require('xlsx');
const sanitizeHtml = require('sanitize-html');

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
  if (doc && Array.isArray(doc.images)) {
    doc.images = doc.images.map(resolveImageUrl);
  }
  return doc;
}

// GET /api/products/:id  (public)
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('shop', 'name logo rating deliveryCharges taxRate')
    .populate('seller', 'name email');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const doc = product.toJSON();
  doc.image = resolveImageUrl(doc.image);
  if (Array.isArray(doc.images)) {
    doc.images = doc.images.map(resolveImageUrl);
  }
  res.json(doc);
});

// POST /api/products  (seller)
const createProduct = asyncHandler(async (req, res) => {
  if (!req.user.isApproved) {
    res.status(403);
    throw new Error('Your seller account has not been approved yet. You cannot upload products.');
  }

  const shop = await getOrCreateShop(req.user);
  const body = req.body || {};

  if (Array.isArray(body.images) && body.images.length > 5) {
    res.status(400);
    throw new Error('Maximum 5 product images allowed');
  }

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
  if (Array.isArray(doc.images)) {
    doc.images = doc.images.map(resolveImageUrl);
  }
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

  if (Array.isArray(req.body.images) && req.body.images.length > 5) {
    res.status(400);
    throw new Error('Maximum 5 product images allowed');
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
  if (Array.isArray(doc.images)) {
    doc.images = doc.images.map(resolveImageUrl);
  }
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

// POST /api/products/bulk (seller)
const bulkCreateProducts = asyncHandler(async (req, res) => {
  if (!req.user.isApproved) {
    res.status(403);
    throw new Error('Your seller account has not been approved yet. You cannot upload products.');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Please upload a CSV or Excel file.');
  }

  let workbook;
  try {
    if (req.file.buffer) {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } else if (req.file.path) {
      workbook = xlsx.readFile(req.file.path);
    } else {
      res.status(400);
      throw new Error('File data could not be retrieved.');
    }
  } catch (err) {
    res.status(400);
    throw new Error('Invalid file format. Could not parse spreadsheet: ' + err.message);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    res.status(400);
    throw new Error('The workbook contains no sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    res.status(400);
    throw new Error('The uploaded file contains no data.');
  }

  if (rows.length > 500) {
    res.status(400);
    throw new Error('File exceeds the limit of 500 rows. Please split your file.');
  }

  const shop = await getOrCreateShop(req.user);
  const validDocs = [];
  const validDocRowNums = [];
  const errors = [];

  const parseList = (val) => {
    if (val === undefined || val === null || val === '') return [];
    if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
    return String(val)
      .split(/[|,]/)
      .map(item => item.trim())
      .filter(Boolean);
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Row 1 is header

    // Validate name
    const name = row.name ? String(row.name).trim() : '';
    if (!name) {
      errors.push({ row: rowNum, message: 'Product name is required' });
      continue;
    }
    if (name.length > 200) {
      errors.push({ row: rowNum, message: 'Product name cannot exceed 200 characters' });
      continue;
    }

    // Validate price
    if (row.price === undefined || row.price === null || row.price === '') {
      errors.push({ row: rowNum, message: 'Price is required' });
      continue;
    }
    const priceVal = Number(row.price);
    if (isNaN(priceVal) || priceVal < 0) {
      errors.push({ row: rowNum, message: 'Price must be a positive number' });
      continue;
    }

    // Validate discountPrice
    let discountPrice = null;
    if (row.discountPrice !== undefined && row.discountPrice !== null && row.discountPrice !== '') {
      const dPrice = Number(row.discountPrice);
      if (isNaN(dPrice) || dPrice < 0) {
        errors.push({ row: rowNum, message: 'Discount price must be a positive number' });
        continue;
      }
      if (dPrice >= priceVal) {
        errors.push({ row: rowNum, message: 'Discount price must be less than regular price' });
        continue;
      }
      discountPrice = dPrice;
    }

    // Validate stock
    const stock = row.stock !== undefined && row.stock !== null && row.stock !== '' ? Number(row.stock) : 0;
    if (isNaN(stock) || stock < 0) {
      errors.push({ row: rowNum, message: 'Stock must be a non-negative number' });
      continue;
    }

    // Description
    let description = row.description ? String(row.description).trim() : name;
    description = sanitizeHtml(description, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height'],
      },
    });

    const category = row.category ? String(row.category).trim() : '';
    const region = row.region ? String(row.region).trim() : undefined;
    const culture = row.culture ? String(row.culture).trim() : undefined;

    const colorFamilies = parseList(row.colorFamilies);
    const seasons = parseList(row.seasons);
    const sizes = parseList(row.sizes);
    const variants = sizes.map(size => ({ size }));

    // Images
    const image_url = row.image_url ? String(row.image_url).trim() : '';
    const image_url_2 = row.image_url_2 ? String(row.image_url_2).trim() : '';
    const image_url_3 = row.image_url_3 ? String(row.image_url_3).trim() : '';

    const images = [];
    if (image_url) images.push(image_url);
    if (image_url_2) images.push(image_url_2);
    if (image_url_3) images.push(image_url_3);

    if (images.length > 5) {
      errors.push({ row: rowNum, message: 'Maximum 5 product images allowed' });
      continue;
    }

    const doc = {
      name,
      description,
      price: priceVal,
      discountPrice,
      stock,
      image: image_url || (images[0] || ''),
      images,
      category,
      region,
      culture,
      colorFamilies,
      seasons,
      variants,
      seller: req.user._id,
      shop: shop._id,
      sellerName: shop.name,
      rating: 0,
      isPublished: true,
    };

    validDocs.push(doc);
    validDocRowNums.push(rowNum);
  }

  let successCount = 0;
  if (validDocs.length > 0) {
    try {
      const inserted = await Product.insertMany(validDocs, { ordered: false });
      successCount = inserted.length;
    } catch (err) {
      if (err.writeErrors) {
        const insertedDocs = err.insertedDocs || [];
        successCount = insertedDocs.length;
        err.writeErrors.forEach(we => {
          const rowNum = validDocRowNums[we.index];
          errors.push({
            row: rowNum,
            message: we.errmsg || 'Database insertion error',
          });
        });
      } else {
        res.status(500);
        throw err;
      }
    }
  }

  const failedCount = rows.length - successCount;
  errors.sort((a, b) => a.row - b.row);

  res.status(201).json({
    successCount,
    failedCount,
    errors,
  });
});

// GET /api/products/bulk/template
const getBulkTemplate = asyncHandler(async (req, res) => {
  const headers = [
    'name',
    'description',
    'category',
    'region',
    'culture',
    'price',
    'discountPrice',
    'stock',
    'image_url',
    'image_url_2',
    'image_url_3',
    'colorFamilies',
    'seasons',
    'sizes'
  ];

  const data = [
    headers,
    [
      'Embroidered Shalwar Kameez',
      'Hand-embroidered cotton shalwar kameez with classic Punjabi threadwork.',
      'Clothing',
      'Punjab',
      'Traditional Clothing',
      5800,
      4990,
      40,
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900',
      '',
      '',
      'Blue, White',
      'Summer, Spring',
      'S, M, L, XL'
    ],
    [
      'Peshawari Chappal',
      'Iconic all-leather Peshawari chappal, handcrafted by master cobblers.',
      'Footwear (Chappals)',
      'KPK',
      'Cultural Accessories',
      4800,
      4290,
      35,
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=900',
      '',
      '',
      'Brown, Black',
      'Summer, Spring, Autumn, Winter',
      '8, 9, 10, 11'
    ],
    [
      'Phulkari Dupatta',
      'Hand-embroidered Phulkari dupatta with vibrant floral motifs on a rich orange base.',
      'Shawls & Dupattas',
      'Punjab',
      'Traditional Clothing',
      3200,
      2890,
      22,
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900',
      '',
      '',
      'Pink, Gold',
      'Winter, Autumn',
      'Free Size'
    ]
  ];

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, 'Template');

  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=bazarix_bulk_upload_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrCreateShop,
  bulkCreateProducts,
  getBulkTemplate,
};

