const jwt = require('jsonwebtoken');

const DEFAULT_JWT_SECRET = 'faro-dev-secret-key';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'replace_with_a_long_random_secret' || secret === 'your_secret_key') {
    process.env.JWT_SECRET = DEFAULT_JWT_SECRET;
    return DEFAULT_JWT_SECRET;
  }
  return secret;
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.business = decoded.businessId || decoded.id;
    if (!req.business) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware;
