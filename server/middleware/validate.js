const { validationResult } = require('express-validator');

/**
 * validate — runs express-validator rules then returns 400 with the first
 * human-readable message if any failed (matches the frontend's
 * err.response.data.message pattern).
 */
const validate = (rules) => async (req, res, next) => {
  await Promise.all(rules.map((rule) => rule.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400);
  return next(new Error(errors.array()[0].msg));
};

module.exports = validate;
