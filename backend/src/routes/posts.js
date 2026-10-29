import { prisma } from "../config/prisma.js";
import { auth } from "../middleware/auth.js";
import { processPost } from "../services/publisher.js";
import { createPostsRouter } from "./posts-router.js";

export { createPostsRouter } from "./posts-router.js";

export default createPostsRouter({
  prisma,
  authenticate: auth,
  publishPost: processPost,
});
