import { spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import Database from "better-sqlite3";
import { StrKey } from "@stellar/stellar-sdk";

const projectRoot = process.cwd();
const port = Number(process.env.LIVE_POLICY_SMOKE_PORT ?? 3036);
const baseUrl = `http://127.0.0.1:${port}`;
const databaseUrl =
  process.env.LIVE_POLICY_SMOKE_DATABASE_URL ??
  `file:./data/quorum-live-policy-smoke-${randomUUID()}.db`;
const fakeCoreContractId =
  process.env.LIVE_POLICY_CORE_CONTRACT_ID ??
  StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId =
  process.env.LIVE_POLICY_PASS_CONTRACT_ID ??
  StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId =
  process.env.LIVE_POLICY_USDC_CONTRACT_ID ??
  StrKey.encodeContract(Buffer.alloc(32, 9));
const eventId = "evt_apac_stellar_builder_meetup";
const organizerWallet =
  "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet =
  "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));

function resolveDatabasePath() {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("live policy smoke expects a file: SQLite DATABASE_URL");
  }

  return path.resolve(projectRoot, databaseUrl.replace(/^file:/, ""));
}

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function createSession(walletAddress) {
  const payload = encodeBase64Url(
    JSON.stringify({ walletAddress, issuedAt: Date.now() }),
  );
  const signature = encodeBase64Url(
    createHmac(
      "sha256",
      process.env.QUORUM_SESSION_SECRET ?? "quorum-local-dev-session-secret",
    )
      .update(payload)
      .digest(),
  );

  return `${payload}.${signature}`;
}

function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with ${code}\n${stdout}\n${stderr}`,
        ),
      );
    });
  });
}

async function readJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function waitForServer(child) {
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < 30_000) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev server exited early with ${child.exitCode}`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(400);
  }

  throw new Error(`Timed out waiting for ${baseUrl}: ${lastError}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertLiveRequired(label, response) {
  const body = await readJson(response);

  assert(response.status === 501, `${label} should require live submission`);
  assert(
    body?.executionMode === "live_required",
    `${label} should report live_required execution mode`,
  );
  assert(body?.proofMode === "live", `${label} should report live proof mode`);
  assert(
    typeof body?.error === "string" &&
      body.error.includes("Freighter transaction submission") &&
      body.error.includes("live action flow"),
    `${label} should explain the live signing handoff`,
  );

  return body;
}

async function assertPreparedAction(
  label,
  response,
  { action, functionName, signer },
) {
  const body = await readJson(response);

  assert(response.status === 200, `${label} should prepare successfully`);
  assert(body?.action === action, `${label} should report ${action}`);
  assert(
    body?.executionMode === "live_required",
    `${label} should report live_required execution mode`,
  );
  assert(body?.proofMode === "live", `${label} should report live proof mode`);
  assert(body?.contractId === fakeCoreContractId, `${label} should target core`);
  assert(
    body?.coreContractId === fakeCoreContractId,
    `${label} should include core contract ID`,
  );
  assert(
    body?.passContractId === fakePassContractId,
    `${label} should include pass contract ID`,
  );
  assert(
    body?.usdcContractId === fakeUsdcContractId,
    `${label} should include USDC contract ID`,
  );
  assert(
    body?.functionName === functionName,
    `${label} should prepare ${functionName}`,
  );
  assert(body?.signer === signer, `${label} should bind signer wallet`);

  return body;
}

function createDraftPayload() {
  return {
    title: `Live Prepared Draft ${randomUUID().slice(0, 8)}`,
    eventType: "workshop",
    shortDescription:
      "A live-policy smoke draft used to prepare unsigned contract action inputs.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1200&q=80",
    startDateTime: "2026-07-01T10:00:00.000Z",
    endDateTime: "2026-07-01T12:00:00.000Z",
    timezone: "Asia/Jakarta",
    locationType: "hybrid",
    locationText: "Jakarta + livestream",
    meetingUrl: "https://example.com/quorum-live-policy",
    isFree: false,
    priceUsdc: "7",
    capacity: 42,
    collaborators: [
      {
        displayName: "Live Policy Host",
        role: "Host",
        walletAddress: organizerWallet,
        splitPercentage: 60,
      },
      {
        displayName: "Live Policy Speaker",
        role: "Speaker",
        walletAddress: speakerWallet,
        splitPercentage: 40,
      },
    ],
    resources: [
      {
        title: "Live Policy Resource",
        description: "Gated resource used by live-policy smoke.",
        type: "link",
        url: "https://example.com/quorum-live-policy-resource",
        sortOrder: 1,
      },
    ],
  };
}

function readMutationCounts(databasePath) {
  const db = new Database(databasePath, { readonly: true });

  try {
    return {
      checkIns: db.prepare("SELECT COUNT(*) AS count FROM check_ins").get().count,
      passes: db.prepare("SELECT COUNT(*) AS count FROM passes").get().count,
      purchases: db.prepare("SELECT COUNT(*) AS count FROM purchases").get().count,
      withdrawals: db.prepare("SELECT COUNT(*) AS count FROM withdrawals").get().count,
    };
  } finally {
    db.close();
  }
}

async function main() {
  const databasePath = resolveDatabasePath();
  fs.rmSync(databasePath, { force: true });
  fs.rmSync(`${databasePath}-shm`, { force: true });
  fs.rmSync(`${databasePath}-wal`, { force: true });

  const env = {
    DATABASE_URL: databaseUrl,
    NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: fakeCoreContractId,
    NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: fakePassContractId,
    NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: fakeUsdcContractId,
    NEXT_TELEMETRY_DISABLED: "1",
  };

  await runCommand("node", ["scripts/db-migrate.mjs"], env);
  await runCommand("node", ["scripts/db-seed.mjs"], env);

  const server = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverOutput = "";

  server.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });

  try {
    await waitForServer(server);

    const contractStatus = await fetch(`${baseUrl}/api/contracts/status`);
    const contractStatusBody = await readJson(contractStatus);
    assert(contractStatus.status === 200, "contract status should render");
    assert(contractStatusBody?.configured === true, "fake live IDs should be valid");
    assert(contractStatusBody?.proofMode === "live", "status should expose live proof mode");
    assert(
      contractStatusBody?.paymentAssetConfigured === true &&
        contractStatusBody?.usdcContractId === fakeUsdcContractId,
      "status should expose configured live payment asset",
    );
    assert(
      contractStatusBody?.actions?.length === 4 &&
        contractStatusBody.actions.every(
          (action) =>
            action.executionMode === "live_required" && action.proofMode === "live",
        ),
      "all contract actions should require live submission",
    );

    const dashboard = await fetch(`${baseUrl}/dashboard`);
    const dashboardHtml = await dashboard.text();
    assert(dashboard.status === 200, "dashboard should render in live policy mode");
    assert(
      dashboardHtml.includes("Action execution"),
      "dashboard should show contract action policy rows",
    );
    assert(
      dashboardHtml.includes("Live transaction submission is required.") &&
        dashboardHtml.includes("live required"),
      "dashboard should show live-required action policy",
    );
    assert(
      dashboardHtml.includes("USDC asset") && dashboardHtml.includes("Configured"),
      "dashboard should show configured USDC payment asset",
    );

    const attendeeCookie = `quorum_session=${createSession(attendeeWallet)}`;
    const organizerCookie = `quorum_session=${createSession(organizerWallet)}`;
    const speakerCookie = `quorum_session=${createSession(speakerWallet)}`;

    const draftResponse = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: organizerCookie,
      },
      body: JSON.stringify(createDraftPayload()),
    });
    const draftBody = await readJson(draftResponse);
    assert(draftResponse.status === 201, "live policy draft should be created");
    assert(draftBody?.event?.id, "live policy draft should return event ID");

    const publishPrepare = await assertPreparedAction(
      "prepare publish",
      await fetch(
        `${baseUrl}/api/events/${draftBody.event.id}/contract-action?action=publish_event`,
        { headers: { cookie: organizerCookie } },
      ),
      {
        action: "publish_event",
        functionName: "create_event",
        signer: organizerWallet,
      },
    );
    assert(
      publishPrepare.args?.priceAtomic === "70000000",
      "prepared publish should encode 7 USDC atomically",
    );
    assert(
      publishPrepare.args?.splits?.map((split) => split.percentBps).join(",") ===
        "6000,4000",
      "prepared publish should encode split bps",
    );

    const checkoutPrepare = await assertPreparedAction(
      "prepare checkout",
      await fetch(
        `${baseUrl}/api/events/${eventId}/contract-action?action=checkout_pass&sourceSequence=0`,
        { headers: { cookie: attendeeCookie } },
      ),
      {
        action: "checkout_pass",
        functionName: "purchase",
        signer: attendeeWallet,
      },
    );
    assert(
      checkoutPrepare.args?.amountAtomic === "50000000",
      "prepared checkout should encode seeded 5 USDC price",
    );
    assert(
      checkoutPrepare.args?.metadataUri?.includes(attendeeWallet),
      "prepared checkout should bind pass metadata URI to buyer",
    );
    assert(
      checkoutPrepare.unsignedTransaction?.simulationRequired === true &&
        typeof checkoutPrepare.unsignedTransaction?.unsignedTransactionXdr ===
          "string",
      "prepared checkout should include optional pre-simulation unsigned XDR",
    );

    const invalidPreflight = await fetch(
      `${baseUrl}/api/events/${eventId}/contract-action/preflight`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: attendeeCookie,
        },
        body: JSON.stringify({
          action: "checkout_pass",
          timeoutSeconds: 0,
        }),
      },
    );
    const invalidPreflightBody = await readJson(invalidPreflight);
    assert(
      invalidPreflight.status === 400,
      "invalid live preflight should fail before RPC",
    );
    assert(
      invalidPreflightBody?.error === "Invalid live transaction preflight request.",
      "invalid live preflight should report schema failure",
    );

    const checkInPrepare = await assertPreparedAction(
      "prepare check-in",
      await fetch(
        `${baseUrl}/api/events/${eventId}/contract-action?action=check_in_pass&tokenId=42`,
        { headers: { cookie: organizerCookie } },
      ),
      {
        action: "check_in_pass",
        functionName: "check_in",
        signer: organizerWallet,
      },
    );
    assert(
      checkInPrepare.args?.tokenId === "42",
      "prepared check-in should encode numeric token ID",
    );

    const withdrawPrepare = await assertPreparedAction(
      "prepare withdraw",
      await fetch(
        `${baseUrl}/api/events/${eventId}/contract-action?action=withdraw_balance`,
        { headers: { cookie: speakerCookie } },
      ),
      {
        action: "withdraw_balance",
        functionName: "withdraw",
        signer: speakerWallet,
      },
    );
    assert(
      withdrawPrepare.args?.collaborator === speakerWallet,
      "prepared withdraw should bind collaborator wallet",
    );

    const invalidLiveSubmit = await fetch(
      `${baseUrl}/api/events/${eventId}/contract-action`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: attendeeCookie,
        },
        body: JSON.stringify({
          action: "checkout_pass",
          signedTransactionXdr: "not-a-signed-transaction-xdr",
        }),
      },
    );
    const invalidLiveSubmitBody = await readJson(invalidLiveSubmit);
    assert(
      invalidLiveSubmit.status === 400,
      "invalid signed live XDR should be rejected before persistence",
    );
    assert(
      invalidLiveSubmitBody?.executionMode === "live_required" &&
        invalidLiveSubmitBody?.proofMode === "live",
      "invalid signed live XDR should preserve live action policy metadata",
    );
    assert(
      typeof invalidLiveSubmitBody?.error === "string",
      "invalid signed live XDR should explain the submission failure",
    );

    await assertLiveRequired(
      "publish",
      await fetch(`${baseUrl}/api/events/${eventId}/publish`, {
        method: "POST",
        headers: { cookie: organizerCookie },
      }),
    );
    await assertLiveRequired(
      "checkout",
      await fetch(`${baseUrl}/api/events/${eventId}/passes`, {
        method: "POST",
        headers: { cookie: attendeeCookie },
      }),
    );
    await assertLiveRequired(
      "check-in",
      await fetch(`${baseUrl}/api/events/${eventId}/check-ins`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: organizerCookie,
        },
        body: JSON.stringify({ tokenId: "qpass-live-policy-placeholder" }),
      }),
    );
    await assertLiveRequired(
      "check-in short live token",
      await fetch(`${baseUrl}/api/events/${eventId}/check-ins`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: organizerCookie,
        },
        body: JSON.stringify({ tokenId: "42" }),
      }),
    );
    await assertLiveRequired(
      "withdraw",
      await fetch(`${baseUrl}/api/events/${eventId}/withdrawals`, {
        method: "POST",
        headers: { cookie: speakerCookie },
      }),
    );

    const counts = readMutationCounts(databasePath);
    assert(counts.passes === 0, "live policy should not create local passes");
    assert(counts.purchases === 0, "live policy should not create local purchases");
    assert(counts.checkIns === 0, "live policy should not create local check-ins");
    assert(counts.withdrawals === 0, "live policy should not create local withdrawals");

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          fakeCoreContractId,
          fakePassContractId,
          fakeUsdcContractId,
          mutationCounts: counts,
          checks: [
            "live-contract-status",
            "live-payment-asset-status",
            "dashboard-live-action-policy",
            "prepare-publish-live-args",
            "prepare-checkout-live-args",
            "prepare-checkout-unsigned-xdr",
            "preflight-route-invalid-request",
            "prepare-check-in-live-args",
            "prepare-withdraw-live-args",
            "submit-invalid-signed-xdr-no-persistence",
            "publish-live-required",
            "checkout-live-required",
            "check-in-live-required",
            "check-in-short-live-token-required",
            "withdraw-live-required",
            "no-local-proof-mutations",
          ],
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          serverOutput: serverOutput.slice(-4000),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    server.kill("SIGTERM");
    await delay(500);
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
    fs.rmSync(`${databasePath}-wal`, { force: true });
  }
}

main();
