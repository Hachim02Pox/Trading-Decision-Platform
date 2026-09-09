import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { loadAppConfig, __resetAppConfigCacheForTests } from "../apps/backend/src/config/env";
import { requireHolder, __resetSupabaseClientForTests } from "../apps/backend/src/auth/supabaseAuth";

/** Runs `fn` with the given env vars set, restoring the previous values (and clearing the loadAppConfig cache) afterward — mirrors the pattern in tests/milestone-invariants.test.ts. */
function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const previous = new Map(Object.keys(vars).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  __resetAppConfigCacheForTests();
  __resetSupabaseClientForTests();
  try {
    return fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    __resetAppConfigCacheForTests();
    __resetSupabaseClientForTests();
  }
}

function fakeReq(headers: Record<string, string> = {}): Request {
  return { header: (name: string) => headers[name.toLowerCase()] } as unknown as Request;
}

function fakeRes(): { res: Response; statusCode: () => number | undefined; body: () => unknown } {
  let statusCode: number | undefined;
  let body: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as Response;
  return { res, statusCode: () => statusCode, body: () => body };
}

test("loadAppConfig: no Supabase credentials in env yields supabase: null", () => {
  withEnv({ SUPABASE_API_URL: undefined, SUPABASE_URL: undefined, SUPABASE_PUBLISHABLE_KEY: undefined, SUPABASE_API_ANON: undefined }, () => {
    assert.equal(loadAppConfig().supabase, null);
  });
});

test("loadAppConfig: accepts the legacy SUPABASE_API_URL (REST path) + SUPABASE_API_ANON names and strips /rest/v1/ from the URL", () => {
  withEnv(
    {
      SUPABASE_API_URL: "https://project-ref.supabase.co/rest/v1/",
      SUPABASE_API_ANON: "anon-key-value",
      SUPABASE_API_service_role: "service-role-value",
    },
    () => {
      const config = loadAppConfig().supabase;
      assert.deepEqual(config, {
        url: "https://project-ref.supabase.co",
        anonKey: "anon-key-value",
        serviceRoleKey: "service-role-value",
      });
    }
  );
});

test("loadAppConfig: accepts the new SUPABASE_PUBLISHABLE_KEY/SUPABASE_SECRET_KEY names, service role optional", () => {
  withEnv(
    {
      SUPABASE_API_URL: undefined,
      SUPABASE_URL: "https://project-ref.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_xyz",
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_API_ANON: undefined,
      SUPABASE_API_service_role: undefined,
    },
    () => {
      assert.deepEqual(loadAppConfig().supabase, {
        url: "https://project-ref.supabase.co",
        anonKey: "sb_publishable_xyz",
        serviceRoleKey: null,
      });
    }
  );
});

test("requireHolder: responds 503 when Supabase is not configured, never calls next()", async () => {
  await withEnv({ SUPABASE_API_URL: undefined, SUPABASE_URL: undefined, SUPABASE_PUBLISHABLE_KEY: undefined, SUPABASE_API_ANON: undefined }, async () => {
    const { res, statusCode, body } = fakeRes();
    let nextCalled = false;
    await requireHolder(fakeReq(), res, () => {
      nextCalled = true;
    });
    assert.equal(statusCode(), 503);
    assert.equal((body() as { error: { code: string } }).error.code, "SUPABASE_NOT_CONFIGURED");
    assert.equal(nextCalled, false);
  });
});

test("requireHolder: responds 401 when configured but no bearer token is present, never calls next()", async () => {
  await withEnv({ SUPABASE_API_URL: "https://project-ref.supabase.co", SUPABASE_API_ANON: "anon-key-value" }, async () => {
    const { res, statusCode, body } = fakeRes();
    let nextCalled = false;
    await requireHolder(fakeReq({ authorization: "NotBearer xyz" }), res, () => {
      nextCalled = true;
    });
    assert.equal(statusCode(), 401);
    assert.equal((body() as { error: { code: string } }).error.code, "MISSING_TOKEN");
    assert.equal(nextCalled, false);
  });
});
