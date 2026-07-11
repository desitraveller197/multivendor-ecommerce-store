const asyncHandler = require('../utils/asyncHandler');
const Poster = require('../models/Poster');

// GET /api/posters  (public) — returns active posters ordered by 'order' field
const listPosters = asyncHandler(async (req, res) => {
  const filter = {};
  // Admin can see all; public only sees active
  if (!req.user || req.user.role !== 'admin') {
    filter.active = true;
  }
  const posters = await Poster.find(filter).sort({ order: 1, createdAt: -1 });
  res.json(posters);
});

// POST /api/posters  (admin)
const createPoster = asyncHandler(async (req, res) => {
  const { title, subtitle, imageUrl, linkUrl, active, order } = req.body;
  if (!imageUrl) {
    res.status(400);
    throw new Error('imageUrl is required');
  }
  const poster = await Poster.create({ title, subtitle, imageUrl, linkUrl, active, order });
  res.status(201).json(poster);
});

// PATCH /api/posters/:id  (admin)
const updatePoster = asyncHandler(async (req, res) => {
  const poster = await Poster.findById(req.params.id);
  if (!poster) {
    res.status(404);
    throw new Error('Poster not found');
  }
  const fields = ['title', 'subtitle', 'imageUrl', 'linkUrl', 'active', 'order'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) poster[f] = req.body[f];
  });
  await poster.save();
  res.json(poster);
});

// DELETE /api/posters/:id  (admin)
const deletePoster = asyncHandler(async (req, res) => {
  const poster = await Poster.findByIdAndDelete(req.params.id);
  if (!poster) {
    res.status(404);
    throw new Error('Poster not found');
  }
  res.json({ message: 'Poster deleted' });
});

module.exports = { listPosters, createPoster, updatePoster, deletePoster };
