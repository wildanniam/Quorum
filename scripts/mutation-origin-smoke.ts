import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { rejectCrossOriginMutation } from "../src/lib/auth/origin";

const projectRoot = process.cwd();
const guardedMutationRoutes = [
  "src/app/api/auth/challenge/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/verify/route.ts",
  "src/app/api/events/route.ts",
  "src/app/api/events/[eventId]/route.ts",
  "src/app/api/events/[eventId]/check-ins/route.ts",
  "src/app/api/events/[eventId]/contract-action/route.ts",
  "src/app/api/events/[eventId]/contract-action/preflight/route.ts",
  "src/app/api/events/[eventId]/passes/route.ts",
  "src/app/api/events/[eventId]/publish/route.ts",
  "src/app/api/events/[eventId]/withdrawals/route.ts",
];

async function readJson(response: Response) {
  return response.json() as Promise<{ error?: string }>;
}

async function main() {
  const sameOriginRequest = new NextRequest("https://quorum.example.com/api/events", {
    headers: {
      origin: "https://quorum.example.com",
    },
    method: "POST",
  });
  assert.equal(rejectCrossOriginMutation(sameOriginRequest), null);

  const missingOriginRequest = new NextRequest("https://quorum.example.com/api/events", {
    method: "POST",
  });
  assert.equal(rejectCrossOriginMutation(missingOriginRequest), null);

  const forwardedSameOriginRequest = new NextRequest(
    "http://127.0.0.1:3000/api/events",
    {
      headers: {
        host: "127.0.0.1:3000",
        origin: "https://quorum.example.com",
        "x-forwarded-host": "quorum.example.com",
        "x-forwarded-proto": "https",
      },
      method: "POST",
    },
  );
  assert.equal(rejectCrossOriginMutation(forwardedSameOriginRequest), null);

  const crossOriginRequest = new NextRequest("https://quorum.example.com/api/events", {
    headers: {
      origin: "https://evil.example",
    },
    method: "POST",
  });
  const crossOriginResponse = rejectCrossOriginMutation(crossOriginRequest);
  assert(crossOriginResponse, "cross-origin request should be rejected");
  assert.equal(crossOriginResponse.status, 403);
  assert.match(
    (await readJson(crossOriginResponse)).error ?? "",
    /Cross-origin mutation/,
  );

  const invalidOriginRequest = new NextRequest("https://quorum.example.com/api/events", {
    headers: {
      origin: "null",
    },
    method: "POST",
  });
  const invalidOriginResponse = rejectCrossOriginMutation(invalidOriginRequest);
  assert(invalidOriginResponse, "invalid Origin header should be rejected");
  assert.equal(invalidOriginResponse.status, 403);

  for (const route of guardedMutationRoutes) {
    const source = fs.readFileSync(path.join(projectRoot, route), "utf8");

    assert(
      source.includes('from "@/lib/auth/origin"'),
      `${route} must import the mutation origin guard`,
    );
    assert(
      source.includes("rejectCrossOriginMutation(request)"),
      `${route} must call the mutation origin guard`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "allow-same-origin-mutation",
          "allow-missing-origin-mutation",
          "allow-forwarded-same-origin-mutation",
          "reject-cross-origin-mutation",
          "reject-invalid-origin-mutation",
          "all-mutation-routes-use-origin-guard",
        ],
        guardedRoutes: guardedMutationRoutes.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
