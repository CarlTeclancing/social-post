import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { auth } from "../middleware/auth.js";
const r = Router();
r.use(auth);
r.get("/", async (req, res) =>
  res.json(
    await prisma.socialAccount.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        platform: true,
        displayName: true,
        platformAccountId: true,
      },
    }),
  ),
);
r.post("/manual", async (req, res) => {
  const {
    platform,
    platformAccountId,
    displayName,
    accessToken,
    refreshToken,
  } = req.body;
  const a = await prisma.socialAccount.upsert({
    where: {
      userId_platform_platformAccountId: {
        userId: req.user.id,
        platform,
        platformAccountId,
      },
    },
    update: { displayName, accessToken, refreshToken },
    create: {
      userId: req.user.id,
      platform,
      platformAccountId,
      displayName,
      accessToken,
      refreshToken,
    },
  });
  res.json({ id: a.id, platform: a.platform, displayName: a.displayName });
});
export default r;
