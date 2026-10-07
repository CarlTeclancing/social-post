import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import { processPost } from "../services/publisher.js";
export function startScheduler() {
  cron.schedule("* * * * *", async () => {
    const due = await prisma.post.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      take: 20,
    });
    for (const p of due) await processPost(p.id);
  });
}
