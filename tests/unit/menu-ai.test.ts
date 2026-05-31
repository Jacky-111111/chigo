import { afterEach, describe, expect, it } from "vitest";
import {
  defaultMenuAnalysisTimeoutMs,
  getMenuAiConfig,
  getMenuAnalysisTimeoutMs,
} from "@/lib/services/menu-ai";

describe("getMenuAiConfig", () => {
  const originalModel = process.env.OPENAI_MENU_MODEL;
  const originalTimeout = process.env.OPENAI_MENU_TIMEOUT_MS;

  afterEach(() => {
    if (originalModel === undefined) {
      delete process.env.OPENAI_MENU_MODEL;
    } else {
      process.env.OPENAI_MENU_MODEL = originalModel;
    }

    if (originalTimeout === undefined) {
      delete process.env.OPENAI_MENU_TIMEOUT_MS;
    } else {
      process.env.OPENAI_MENU_TIMEOUT_MS = originalTimeout;
    }
  });

  it("defaults menu analysis to gpt-4o-mini", () => {
    delete process.env.OPENAI_MENU_MODEL;

    expect(getMenuAiConfig().model).toBe("gpt-4o-mini");
  });
});

describe("getMenuAnalysisTimeoutMs", () => {
  it("uses a safe default when the env value is missing or invalid", () => {
    expect(getMenuAnalysisTimeoutMs()).toBe(defaultMenuAnalysisTimeoutMs);
    expect(getMenuAnalysisTimeoutMs("not-a-number")).toBe(
      defaultMenuAnalysisTimeoutMs,
    );
  });

  it("clamps configured timeout values", () => {
    expect(getMenuAnalysisTimeoutMs("100")).toBe(10_000);
    expect(getMenuAnalysisTimeoutMs("25000")).toBe(25_000);
    expect(getMenuAnalysisTimeoutMs("500000")).toBe(120_000);
  });
});
