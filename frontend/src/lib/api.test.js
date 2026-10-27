// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api.js";

describe("API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("sends JSON requests with the saved bearer token and parses the response", async () => {
    localStorage.setItem("token", "test-token");
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "post-1" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const result = await api("/posts", {
      method: "POST",
      body: JSON.stringify({ content: "Test post" }),
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/posts",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
      }),
    );
    expect(result).toEqual({ id: "post-1" });
  });

  it("surfaces API error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Select an account" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(api("/posts", { method: "POST" })).rejects.toThrow(
      "Select an account",
    );
  });
});
