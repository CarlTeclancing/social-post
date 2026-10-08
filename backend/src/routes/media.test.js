import test from "node:test";
import assert from "node:assert/strict";
import { validateMedia } from "../services/cloudflare.js";

test("accepts supported media files up to 50 MB", () => {
  validateMedia({
    mimetype: "image/png",
    size: 50 * 1024 * 1024,
  });
});

test("rejects unsupported media types", () => {
  assert.throws(
    () => validateMedia({ mimetype: "application/pdf", size: 10 }),
    /Only JPG, PNG, WebP, GIF, MP4, and WebM files are supported/,
  );
});
