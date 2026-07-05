const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// In serverless (Vercel), the filesystem is read-only except /tmp
const isServerless = !!process.env.VERCEL;
const UPLOAD_DIR = isServerless
  ? '/tmp/uploads'
  : path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.warn('Could not create upload dir (read-only fs):', err.message);
}

const storage = isServerless
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
      },
    });

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'));
  },
});

module.exports = upload;

