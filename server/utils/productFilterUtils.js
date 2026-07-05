const SIZE_ALIASES = {
  'extra small': 'XS',
  xs: 'XS',
  small: 'S',
  s: 'S',
  medium: 'M',
  m: 'M',
  large: 'L',
  l: 'L',
  'extra large': 'XL',
  xl: 'XL',
};

const COLOR_KEYWORDS = {
  Black: ['black', 'charcoal', 'jet'],
  White: ['white', 'ivory', 'cream', 'off white'],
  Blue: ['blue', 'navy', 'ajrak', 'teal', 'turquoise'],
  Red: ['red', 'maroon', 'crimson', 'burgundy', 'phulkari'],
  Green: ['green', 'olive', 'emerald', 'mint', 'herbal'],
  Brown: ['brown', 'tan', 'beige', 'camel', 'khaki', 'leather', 'copper', 'wood'],
  Pink: ['pink', 'rose', 'magenta', 'blush'],
  Gold: ['gold', 'golden', 'mustard', 'yellow', 'bronze', 'embroidered'],
};

function normalizeSize(value) {
  const key = String(value || '').trim().toLowerCase();
  return SIZE_ALIASES[key] || null;
}

function deriveSizes(product) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const sizes = product.variants.map((v) => normalizeSize(v.size)).filter(Boolean);
    if (sizes.length > 0) return [...new Set(sizes)];
  }
  const haystack = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
  if (/(chappal|khussa|jutti|footwear)/.test(haystack)) return ['S', 'M', 'L', 'XL'];
  if (/(dupatta|shawl|food|beauty|decor|pottery)/.test(haystack)) return [];
  return ['XS', 'S', 'M', 'L', 'XL'];
}

function deriveColorFamilies(product) {
  if (Array.isArray(product.colorFamilies) && product.colorFamilies.length > 0) {
    return product.colorFamilies;
  }
  const haystack = `${product.name || ''} ${product.description || ''} ${product.category || ''} ${(product.variants || [])
    .map((v) => v.color || '')
    .join(' ')}`.toLowerCase();
  const colors = [];
  for (const [family, keywords] of Object.entries(COLOR_KEYWORDS)) {
    if (keywords.some((kw) => haystack.includes(kw))) colors.push(family);
  }
  if (colors.length === 0) {
    if ((product.category || '').includes('Organic Beauty')) colors.push('Green');
    else if ((product.category || '').includes('Handicrafts')) colors.push('Brown');
    else colors.push('Blue');
  }
  return [...new Set(colors)];
}

function deriveSeasons(product) {
  if (Array.isArray(product.seasons) && product.seasons.length > 0) {
    return product.seasons;
  }
  const haystack = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
  const seasons = [];
  if (/(shawl|wool|pashmina|warm|winter)/.test(haystack)) seasons.push('Winter');
  if (/(lawn|cotton|summer|lightweight|breathable)/.test(haystack)) seasons.push('Summer');
  if (/(floral|spring|fresh|herbal)/.test(haystack)) seasons.push('Spring');
  if (/(autumn|festive|embroidered|ajrak|khussa|leather)/.test(haystack)) seasons.push('Autumn');
  if (seasons.length === 0) {
    if ((product.category || '').includes('Local Foods')) return ['Autumn', 'Winter'];
    return ['Spring', 'Summer'];
  }
  return [...new Set(seasons)];
}

function buildFilterFields(product) {
  const sizes = deriveSizes(product);
  return {
    colorFamilies: deriveColorFamilies(product),
    seasons: deriveSeasons(product),
    variants:
      Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants
        : sizes.map((size) => ({ size })),
  };
}

function productMatchesFilters(product, { sizes = [], colorFamilies = [], seasons = [] } = {}) {
  const productSizes = deriveSizes(product);
  const productColors = deriveColorFamilies(product);
  const productSeasons = deriveSeasons(product);

  const matchSize =
    !sizes.length || sizes.some((size) => productSizes.includes(normalizeSize(size) || size));
  const matchColor = !colorFamilies.length || colorFamilies.some((c) => productColors.includes(c));
  const matchSeason = !seasons.length || seasons.some((s) => productSeasons.includes(s));

  return matchSize && matchColor && matchSeason;
}

module.exports = {
  normalizeSize,
  deriveSizes,
  deriveColorFamilies,
  deriveSeasons,
  buildFilterFields,
  productMatchesFilters,
};
