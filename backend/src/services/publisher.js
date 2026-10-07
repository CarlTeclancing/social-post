import { prisma } from "../config/prisma.js";
import { publishToProvider } from "./providers/index.js";
export async function processPost(postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      media: true,
      destinations: { include: { socialAccount: true } },
    },
  });
  if (!post) return;
  await prisma.post.update({
    where: { id: postId },
    data: { status: "PROCESSING" },
  });
  let ok = 0,
    fail = 0;
  for (const d of post.destinations) {
    try {
      await prisma.postDestination.update({
        where: { id: d.id },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });
      const result = await publishToProvider({ ...d, post });
      await prisma.postDestination.update({
        where: { id: d.id },
        data: {
          status: "PUBLISHED",
          platformPostId: result.id || null,
          publishedAt: new Date(),
          errorMessage: null,
        },
      });
      ok++;
    } catch (e) {
      fail++;
      await prisma.postDestination.update({
        where: { id: d.id },
        data: {
          status: "FAILED",
          errorMessage: e.response?.data
            ? JSON.stringify(e.response.data)
            : e.message,
        },
      });
    }
  }
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: fail === 0 ? "PUBLISHED" : ok ? "PARTIAL_FAILED" : "FAILED",
    },
  });
}
