import test from "node:test";
import assert from "node:assert/strict";
import { createMediaKey, createPublicMediaUrl } from "./cloudflare.js";

test("creates a sanitized media key for uploads", () => {
  assert.equal(
    createMediaKey("my photo.png", "image/png", 1730000000000),
    "media/1730000000000-my-photo.png",
  );
});

test("builds a public media URL without duplicating slashes", () => {
  assert.equal(
    createPublicMediaUrl("https://cdn.example.com/", "media/file.jpg"),
    "https://cdn.example.com/media/file.jpg",
  );
});
