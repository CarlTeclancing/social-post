// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./main.jsx";

const { api } = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("./lib/api", () => ({ api }));

const connectedAccount = {
  id: "account-1",
  platform: "LINKEDIN",
  displayName: "Test account",
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe("frontend app", () => {
  it("switches between sign-in and registration forms", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.getByRole("heading", { name: "Create account" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Already have an account?" }),
    ).toBeTruthy();
  });

  it("signs in, validates the composer, submits a post, and opens publishing history", async () => {
    const user = userEvent.setup();
    api.mockImplementation(async (path, options = {}) => {
      if (path === "/auth/login") return { token: "test-token" };
      if (path === "/social") return [connectedAccount];
      if (path === "/posts" && !options.method) return [];
      if (path === "/posts" && options.method === "POST") {
        return { id: "post-1", content: "A frontend test post" };
      }
      throw new Error(`Unexpected API request: ${path}`);
    });
    render(<App />);

    await user.type(screen.getByPlaceholderText("Email"), "tester@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "test-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const postButton = await screen.findByRole("button", { name: "Post now" });
    expect(postButton.disabled).toBe(true);

    await user.type(
      screen.getByPlaceholderText("What do you want to share?"),
      "A frontend test post",
    );
    expect(postButton.disabled).toBe(true);

    await user.click(screen.getByLabelText(/LINKEDIN/));
    expect(postButton.disabled).toBe(false);
    await user.click(postButton);

    await screen.findByRole("heading", { name: "Publishing" });
    expect(api).toHaveBeenCalledWith(
      "/posts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content: "A frontend test post",
          scheduledAt: null,
          accountIds: ["account-1"],
          media: [],
        }),
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 1250));
  }, 15000);

  it("shows a sign-in error returned by the API", async () => {
    const user = userEvent.setup();
    api.mockImplementation(() =>
      Promise.reject(new Error("Invalid credentials")),
    );
    render(<App />);

    await user.type(screen.getByPlaceholderText("Email"), "tester@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid credentials")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
  });
});
