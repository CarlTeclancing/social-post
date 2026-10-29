import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { auth } from "../middleware/auth.js";
import { createPostsRouter } from "./posts-router.js";

const user = { id: "user-1", email: "test@example.com" };
const account = {
  id: "account-1",
  userId: user.id,
  platform: "LINKEDIN",
  platformAccountId: "member-1",
};

function createTestApp() {
  process.env.JWT_SECRET = "test-secret";
  let createdPost;
  const publishedPostIds = [];
  const database = {
    socialAccount: {
      findMany: async ({ where }) =>
        where.userId === user.id && where.id.in.includes(account.id)
          ? [account]
          : [],
    },
    post: {
      create: async ({ data }) => {
        createdPost = data;
        return {
          id: "post-1",
          userId: data.userId,
          content: data.content,
          status: data.status,
          scheduledAt: data.scheduledAt,
          media: data.media.create,
          destinations: data.destinations.create,
        };
      },
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/api/posts", createPostsRouter({
    prisma: database,
    authenticate: auth,
    publishPost: async (id) => publishedPostIds.push(id),
  }));
  return {
    app,
    getCreatedPost: () => createdPost,
    publishedPostIds,
    token: jwt.sign(user, process.env.JWT_SECRET),
  };
}

async function withServer(app, callback) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("an authenticated user can create a post for their connected account", async () => {
  const { app, getCreatedPost, publishedPostIds, token } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "A test post",
        accountIds: [account.id],
        media: [],
      }),
    });
    const post = await response.json();

    assert.equal(response.status, 201);
    assert.equal(post.userId, user.id);
    assert.equal(post.content, "A test post");
    assert.deepEqual(post.destinations, [
      {
        socialAccountId: account.id,
        platform: account.platform,
        contentOverride: null,
      },
    ]);
    assert.equal(getCreatedPost().userId, user.id);
    assert.deepEqual(publishedPostIds, ["post-1"]);
  });
});

test("a user cannot create a post for another user's account", async () => {
  const { app, getCreatedPost, token } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Should not be created",
        accountIds: ["another-users-account"],
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Select at least one connected account",
    });
    assert.equal(getCreatedPost(), undefined);
  });
});

test("post creation requires authentication", async () => {
  const { app, getCreatedPost } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Unauthorized", accountIds: [account.id] }),
    });

    assert.equal(response.status, 401);
    assert.equal(getCreatedPost(), undefined);
  });
});
