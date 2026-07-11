const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');

// GET /api/categories  (public)
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

// POST /api/categories  (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const exists = await Category.findOne({ name });
  if (exists) {
    res.status(400);
    throw new Error('Category already exists');
  }
  const category = await Category.create({ name });
  res.status(201).json(category);
});

// DELETE /api/categories/:id  (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  await category.deleteOne();
  res.json({ message: 'Category deleted' });
});

// PUT /api/categories/:id  (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const exists = await Category.findOne({ name: name.trim(), _id: { $ne: category._id } });
  if (exists) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }

  category.name = name.trim();
  await category.save();
  res.json(category);
});

module.exports = { listCategories, createCategory, deleteCategory, updateCategory };
