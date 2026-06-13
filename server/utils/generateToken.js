const jwt = require('jsonwebtoken');

/**
 * Sign a JWT with payload { id, role }.
 * Secret + expiry come from env (JWT_SECRET / JWT_EXPIRES, default 7d).
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

module.exports = generateToken;
