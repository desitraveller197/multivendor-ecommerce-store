/**
 * authorize(...roles) — allow only the listed roles; 403 otherwise.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error('Forbidden: insufficient role'));
  }
  next();
};

/**
 * requireApprovedSeller — seller routes additionally require isApproved === true.
 */
const requireApprovedSeller = (req, res, next) => {
  if (req.user && req.user.role === 'seller' && !req.user.isApproved) {
    res.status(403);
    return next(new Error('Your seller account is awaiting admin approval'));
  }
  next();
};

module.exports = { authorize, requireApprovedSeller };
