import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { uploadMediaToCloudflare } from "../services/cloudflare.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.use(auth);
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const result = await uploadMediaToCloudflare(req.file);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Media upload failed" });
  }
});

export default router;
