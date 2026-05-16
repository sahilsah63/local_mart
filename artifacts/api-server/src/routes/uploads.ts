import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import { authenticate, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * POST /uploads/sign
 * Returns a signed upload URL that the mobile/admin clients can use to
 * upload directly to Cloudinary. Server never proxies the actual file
 * (faster + cheaper).
 *
 * Body: { folder?: string }  e.g. "products" | "shops" | "users" | "bookings"
 * Returns: { signature, timestamp, apiKey, cloudName, folder, uploadUrl }
 */
router.post("/sign", authenticate, async (req: AuthRequest, res) => {
  try {
    const folder = (req.body?.folder as string) || "uploads";
    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");

    const timestamp = Math.floor(Date.now() / 1000);
    const params = { folder: `techniconnect/${safeFolder}`, timestamp };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET as string,
    );

    res.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: params.folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    });
  } catch (err) {
    console.error("[/uploads/sign] error:", err);
    res.status(500).json({ error: "Could not generate upload signature" });
  }
});

export default router;
