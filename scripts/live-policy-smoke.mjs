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
const eventId = "evt_apac_stellar_builder_meetup";
const organizerWallet =
  "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet =
  "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const attendeeWallet =
  "GDUMVTGZ5UWC6ATN5MEOK7S6XAJCC2B7HVS64TMKPQV5XHZDEH5YASYA";

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
      body.error.includes("Freighter transaction submission"),
    `${label} should explain the missing app-side signing boundary`,
  );

  return body;
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
    assert(contractStatusBody?.configured === true, "fake contract IDs should be valid");
    assert(contractStatusBody?.proofMode === "live", "status should expose live proof mode");
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

    const attendeeCookie = `quorum_session=${createSession(attendeeWallet)}`;
    const organizerCookie = `quorum_session=${createSession(organizerWallet)}`;
    const speakerCookie = `quorum_session=${createSession(speakerWallet)}`;

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
          mutationCounts: counts,
          checks: [
            "live-contract-status",
            "dashboard-live-action-policy",
            "publish-live-required",
            "checkout-live-required",
            "check-in-live-required",
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
