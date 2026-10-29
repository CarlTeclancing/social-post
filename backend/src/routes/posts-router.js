import { Router } from "express";

export function createPostsRouter({
  prisma: database,
  authenticate,
  publishPost,
}) {
  const r = Router();
  r.use(authenticate);
  r.get("/", async (req, res) =>
    res.json(
      await database.post.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          media: true,
          destinations: {
            include: {
              socialAccount: { select: { displayName: true, platform: true } },
            },
          },
        },
      }),
    ),
  );
  r.post("/", async (req, res) => {
    const {
      content,
      scheduledAt,
      media = [],
      accountIds = [],
      overrides = {},
    } = req.body;
    const accounts = await database.socialAccount.findMany({
      where: { id: { in: accountIds }, userId: req.user.id },
    });
    if (!accounts.length)
      return res
        .status(400)
        .json({ error: "Select at least one connected account" });
    const post = await database.post.create({
      data: {
        userId: req.user.id,
        content,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        media: { create: media.map((m) => ({ type: m.type, url: m.url })) },
        destinations: {
          create: accounts.map((a) => ({
            socialAccountId: a.id,
            platform: a.platform,
            contentOverride: overrides[a.platform] || null,
          })),
        },
      },
      include: { media: true, destinations: true },
    });
    if (!scheduledAt) {
      publishPost(post.id).catch(console.error);
    }
    res.status(201).json(post);
  });
  r.post("/:id/retry", async (req, res) => {
    const post = await database.post.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!post) return res.sendStatus(404);
    await database.postDestination.updateMany({
      where: { postId: post.id, status: "FAILED" },
      data: { status: "PENDING", errorMessage: null },
    });
    publishPost(post.id).catch(console.error);
    res.json({ ok: true });
  });
  return r;
}
