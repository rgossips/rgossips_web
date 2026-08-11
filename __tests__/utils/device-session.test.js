import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  getDeviceId,
  isCurrentDeviceActive,
  parseDeviceName,
  registerDeviceSession,
} from "@/utils/device-session";

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalCrypto = globalThis.crypto;

function installBrowser({ userAgent = "UnitTest/1.0", existingId = null } = {}) {
  const values = new Map(existingId ? [["rg.device_id", existingId]] : []);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { navigator: { userAgent } },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: {
      getItem: jest.fn((key) => values.get(key) ?? null),
      setItem: jest.fn((key, value) => values.set(key, value)),
    },
  });
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    writable: true,
    value: { randomUUID: jest.fn(() => "device-uuid") },
  });
}

function uninstallBrowser() {
  for (const [key, value] of [["window", originalWindow], ["localStorage", originalLocalStorage], ["crypto", originalCrypto]]) {
    if (value === undefined) delete globalThis[key];
    else Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
}

afterEach(() => {
  uninstallBrowser();
  jest.restoreAllMocks();
});

describe("getDeviceId", () => {
  it("returns null during SSR", () => {
    delete globalThis.window;
    expect(getDeviceId()).toBeNull();
  });

  it("creates, persists, and reuses one browser device id", () => {
    installBrowser();
    expect(getDeviceId()).toBe("device-uuid");
    expect(localStorage.setItem).toHaveBeenCalledWith("rg.device_id", "device-uuid");
    expect(getDeviceId()).toBe("device-uuid");
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
});

describe("registerDeviceSession", () => {
  it("does nothing on SSR, without a user, or when no device id is available", async () => {
    delete globalThis.window;
    expect(await registerDeviceSession({}, "user-1")).toBeNull();
    installBrowser();
    expect(await registerDeviceSession({}, "")).toBeNull();
  });

  it("upserts the current browser session and truncates a long user agent", async () => {
    const userAgent = `Mozilla/5.0 (Windows NT 10.0) Chrome/120 ${"x".repeat(600)}`;
    installBrowser({ userAgent, existingId: "known-device" });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const supabase = { from: jest.fn(() => ({ upsert })) };

    await expect(registerDeviceSession(supabase, "user-1")).resolves.toBe("known-device");
    expect(supabase.from).toHaveBeenCalledWith("device_sessions");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-1",
      device_id: "known-device",
      user_agent: userAgent.slice(0, 500),
      device_name: "Windows \u00b7 Chrome",
      is_active: true,
    }), { onConflict: "user_id,device_id" });
  });

  it("returns the device id and logs a non-fatal database error", async () => {
    installBrowser({ existingId: "known-device" });
    const error = { message: "network unavailable" };
    const upsert = jest.fn().mockResolvedValue({ error });
    const log = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(registerDeviceSession({ from: () => ({ upsert }) }, "user-1")).resolves.toBe("known-device");
    expect(log).toHaveBeenCalledWith("registerDeviceSession failed:", "network unavailable");
  });
});

describe("isCurrentDeviceActive", () => {
  it("fails open on SSR, missing user, missing row, and query error", async () => {
    delete globalThis.window;
    expect(await isCurrentDeviceActive({}, "user-1")).toBe(true);
    installBrowser({ existingId: "known-device" });
    expect(await isCurrentDeviceActive({}, null)).toBe(true);

    const query = (result) => {
      const maybeSingle = jest.fn().mockResolvedValue(result);
      const secondEq = jest.fn(() => ({ maybeSingle }));
      const firstEq = jest.fn(() => ({ eq: secondEq }));
      return { from: jest.fn(() => ({ select: jest.fn(() => ({ eq: firstEq })) })), maybeSingle };
    };
    await expect(isCurrentDeviceActive(query({ data: null, error: null }), "user-1")).resolves.toBe(true);
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(isCurrentDeviceActive(query({ data: null, error: { message: "denied" } }), "user-1")).resolves.toBe(true);
    expect(log).toHaveBeenCalledWith("isCurrentDeviceActive failed:", "denied");
  });

  it("returns false only when the current device was explicitly revoked", async () => {
    installBrowser({ existingId: "known-device" });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { is_active: false }, error: null });
    const secondEq = jest.fn(() => ({ maybeSingle }));
    const firstEq = jest.fn(() => ({ eq: secondEq }));
    const select = jest.fn(() => ({ eq: firstEq }));
    const from = jest.fn(() => ({ select }));

    await expect(isCurrentDeviceActive({ from }, "user-1")).resolves.toBe(false);
    expect(from).toHaveBeenCalledWith("device_sessions");
    expect(select).toHaveBeenCalledWith("is_active");
    expect(firstEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(secondEq).toHaveBeenCalledWith("device_id", "known-device");
  });

  it("keeps an active row active", async () => {
    installBrowser({ existingId: "known-device" });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { is_active: true }, error: null });
    const supabase = { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) }) };
    await expect(isCurrentDeviceActive(supabase, "user-1")).resolves.toBe(true);
  });
});

describe("parseDeviceName additional negative inputs", () => {
  it("uses Device for an unknown browser and operating system", () => {
    expect(parseDeviceName("CustomAgent/1.0")).toBe("Device");
  });
});
