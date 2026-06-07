import { spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Keypair } from "@stellar/stellar-sdk";

const projectRoot = process.cwd();
const port = Number(process.env.DEMO_SMOKE_PORT ?? 3035);
const baseUrl = `http://127.0.0.1:${port}`;
const databaseUrl =
  process.env.DEMO_SMOKE_DATABASE_URL ??
  `file:./data/quorum-demo-smoke-${randomUUID()}.db`;
const eventId = "evt_apac_stellar_builder_meetup";
const eventSlug = "apac-stellar-builder-meetup";
const organizerWallet =
  "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";

function resolveDatabasePath() {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("demo smoke expects a file: SQLite DATABASE_URL");
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

async function main() {
  const databasePath = resolveDatabasePath();
  fs.rmSync(databasePath, { force: true });
  fs.rmSync(`${databasePath}-shm`, { force: true });
  fs.rmSync(`${databasePath}-wal`, { force: true });

  const env = {
    DATABASE_URL: databaseUrl,
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

    const attendeeWallet = Keypair.random().publicKey();
    const attendeeCookie = `quorum_session=${createSession(attendeeWallet)}`;
    const organizerCookie = `quorum_session=${createSession(organizerWallet)}`;

    const marketplace = await fetch(baseUrl);
    const marketplaceHtml = await marketplace.text();
    assert(marketplace.status === 200, "marketplace should render");
    assert(
      marketplaceHtml.includes("APAC Stellar Builder Meetup"),
      "marketplace should include seeded event",
    );

    const eventPage = await fetch(`${baseUrl}/events/${eventSlug}`);
    const eventHtml = await eventPage.text();
    assert(eventPage.status === 200, "event detail should render");
    assert(eventHtml.includes("/checkout"), "event page should link checkout");

    const checkout = await fetch(
      `${baseUrl}/api/events/${eventId}/passes`,
      {
        method: "POST",
        headers: { cookie: attendeeCookie },
      },
    );
    const checkoutBody = await readJson(checkout);
    const tokenId = checkoutBody?.pass?.tokenId;
    assert(checkout.status === 201, "checkout should create a pass");
    assert(typeof tokenId === "string", "checkout should return token ID");
    assert(
      checkoutBody?.purchase?.txHash?.startsWith("stub:purchase:"),
      "checkout should record purchase proof",
    );

    const duplicateCheckout = await fetch(
      `${baseUrl}/api/events/${eventId}/passes`,
      {
        method: "POST",
        headers: { cookie: attendeeCookie },
      },
    );
    assert(duplicateCheckout.status === 409, "duplicate checkout should fail");

    const lockedResources = await fetch(
      `${baseUrl}/events/${eventSlug}/resources`,
    );
    const lockedHtml = await lockedResources.text();
    assert(lockedHtml.includes("Locked"), "resources should lock anonymously");

    const unlockedResources = await fetch(
      `${baseUrl}/events/${eventSlug}/resources`,
      { headers: { cookie: attendeeCookie } },
    );
    const unlockedHtml = await unlockedResources.text();
    assert(
      unlockedHtml.includes("Unlocked"),
      "resources should unlock for pass owner",
    );

    const unauthorizedCheckIn = await fetch(
      `${baseUrl}/api/events/${eventId}/check-ins`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: attendeeCookie,
        },
        body: JSON.stringify({ tokenId }),
      },
    );
    assert(
      unauthorizedCheckIn.status === 403,
      "attendee should not check in own pass",
    );

    const checkIn = await fetch(`${baseUrl}/api/events/${eventId}/check-ins`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: organizerCookie,
      },
      body: JSON.stringify({ tokenId }),
    });
    const checkInBody = await readJson(checkIn);
    assert(checkIn.status === 201, "organizer check-in should succeed");
    assert(
      checkInBody?.checkIn?.txHash?.startsWith("stub:check-in:"),
      "check-in should record proof hash",
    );

    const duplicateCheckIn = await fetch(
      `${baseUrl}/api/events/${eventId}/check-ins`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: organizerCookie,
        },
        body: JSON.stringify({ tokenId }),
      },
    );
    assert(duplicateCheckIn.status === 409, "duplicate check-in should fail");

    const passPage = await fetch(
      `${baseUrl}/passes/${encodeURIComponent(tokenId)}`,
      { headers: { cookie: attendeeCookie } },
    );
    const passHtml = await passPage.text();
    assert(passPage.status === 200, "pass page should render");
    assert(passHtml.includes("Checked in"), "pass should show checked-in state");

    const organizerDashboard = await fetch(`${baseUrl}/dashboard`, {
      headers: { cookie: organizerCookie },
    });
    const dashboardHtml = await organizerDashboard.text();
    assert(organizerDashboard.status === 200, "dashboard should render");
    assert(dashboardHtml.includes("5 USDC"), "dashboard should show routed USDC");
    assert(
      dashboardHtml.includes("APAC Stellar Builder Meetup"),
      "dashboard should show organizer event",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          databasePath,
          eventId,
          tokenId,
          checks: [
            "marketplace",
            "event-detail",
            "checkout",
            "duplicate-checkout-guard",
            "resource-gating",
            "organizer-check-in",
            "duplicate-check-in-guard",
            "pass-page",
            "dashboard-proof",
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

await main();
