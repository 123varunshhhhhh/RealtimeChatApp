import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure upload directories
const baseUploadDir = path.join(__dirname, '../uploads');
const storyUploadDir = path.join(baseUploadDir, 'stories');

// Ensure directories exist
[baseUploadDir, storyUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Common storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'storyMedia') {
      cb(null, storyUploadDir);
    } else {
      cb(null, baseUploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg", "image/png", "image/webp",
    "audio/webm", "audio/mpeg", "audio/mp3", "audio/wav",
    "image/jpg", "video/mp4", "video/webm"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const limits = { fileSize: 50 * 1024 * 1024 }; // 50MB

// Export configured upload handlers
export const upload = multer({ storage, fileFilter, limits });
export const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]);
export const uploadSingleImage = upload.single("image");
export const uploadStoryMedia = upload.single("storyMedia");