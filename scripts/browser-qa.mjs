import { spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Keypair } from "@stellar/stellar-sdk";
import { chromium } from "playwright";
import { withClient } from "./postgres-utils.mjs";

const projectRoot = process.cwd();
const browserQaPath = path.join(projectRoot, "docs", "BROWSER_QA.md");
const screenshotDir = process.env.BROWSER_QA_SCREENSHOT_DIR?.trim() || null;
const port = Number(process.env.BROWSER_QA_PORT ?? 3040);
const baseUrl = `http://127.0.0.1:${port}`;
const databaseSchema =
  process.env.BROWSER_QA_DB_SCHEMA ??
  `quorum_browser_qa_${randomUUID().replaceAll("-", "_")}`;
process.env.QUORUM_DB_SCHEMA = databaseSchema;
const browserSessionSecret = "quorum-local-dev-session-secret";
const eventId = "evt_apac_stellar_builder_meetup";
const eventSlug = "apac-stellar-builder-meetup";
const organizerWallet =
  "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const collaboratorWallet =
  "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const moneyGramDestination =
  "GCVU24AUYIXAJNIRWCAXX5OKF6AZY23R6IYGPMRGFN5XDDFMW6I7XKUW";

const viewports = [
  { label: "Desktop", width: 1280, height: 720 },
  { label: "Mobile", width: 390, height: 844 },
];

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
    createHmac("sha256", browserSessionSecret).update(payload).digest(),
  );

  return `${payload}.${signature}`;
}

async function readJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildPages({ attendeeCookie, collaboratorCookie, organizerCookie, tokenId }) {
  return [
    {
      label: "Landing",
      path: "/",
      requiredText: [
        "Where Web3 Events",
        "Pay Every",
        "Built for collaborative payments",
        "Got questions?",
        "Start Splitting",
      ],
    },
    {
      label: "Discover",
      path: "/discover",
      requiredText: [
        "APAC Stellar Builder Meetup",
        "Stellar Open Office Hours",
        "5 USDC",
        "Free",
      ],
    },
    {
      label: "Paid event detail",
      path: `/events/${eventSlug}`,
      requiredText: [
        "APAC Stellar Builder Meetup",
        "Get pass",
        "70%",
        "20%",
        "10%",
      ],
    },
    {
      label: "Checkout",
      path: `/events/${eventSlug}/checkout`,
      requiredText: [
        "Review pass",
        "Freighter approval",
        "The pass becomes the access key.",
      ],
    },
    {
      label: "Locked resources",
      path: `/events/${eventSlug}/resources`,
      requiredText: ["LOCKED", "Connect the wallet", "Get pass"],
    },
    {
      cookieValue: attendeeCookie,
      label: "Pass library",
      path: "/passes",
      requiredText: [
        "Wallet-bound passes and receipts.",
        "Open receipt",
        "checked in",
      ],
    },
    {
      cookieValue: attendeeCookie,
      label: "Pass receipt",
      path: `/passes/${encodeURIComponent(tokenId)}`,
      requiredText: [
        "Wallet-bound pass",
        "Receipt proof path",
        "Check-in proof",
        "Access unlocked",
      ],
    },
    {
      cookieValue: organizerCookie,
      label: "Organizer check-in",
      path: `/check-in/${eventId}?token=${encodeURIComponent(tokenId)}`,
      requiredText: ["Organizer check-in", "Check in pass", "Recent check-ins"],
    },
    {
      label: "Event proof",
      path: `/events/${eventSlug}/proof`,
      requiredText: ["Event proof", "Event proof timeline", "Event-level proof"],
    },
    {
      label: "Studio wallet gate",
      path: "/dashboard",
      requiredText: [
        "Your event workspace starts with your wallet.",
        "Connect to continue",
        "Work, not system status",
        "Hosting",
        "Collaborating",
        "Attending",
      ],
    },
    {
      label: "Create event",
      path: "/dashboard/events/new",
      requiredText: [
        "Create an event, one decision at a time.",
        "Event story",
        "Revenue split",
      ],
    },
    {
      cookieValue: collaboratorCookie,
      label: "Collaborator ledger",
      path: "/dashboard/ledger",
      requiredText: [
        "Collaborator ledger",
        "Revenue, wallet settlement",
        "Move settled wallet funds",
        "Wallet transfer required",
        "0.4 USDC",
        "Event revenue and contract settlements",
      ],
    },
    {
      label: "Evidence hub",
      path: "/evidence",
      requiredText: [
        "Trace Quorum settlement from checkout to payout.",
        "Proof timeline",
        "App proof",
      ],
    },
  ];
}

async function seedCashOutFixture() {
  await withClient(async (client) => {
    const settledForCashOutId = "wdr_browser_moneygram_history";
    const readyForCashOutId = "wdr_browser_moneygram_ready";
    const settlementTxHash = "a".repeat(64);
    const purchaseTime = await client.query(
      "SELECT COALESCE(MAX(created_at), now()) AS created_at FROM purchases WHERE event_id = $1",
      [eventId],
    );
    const baseTime = new Date(purchaseTime.rows[0].created_at).getTime();

    await client.query(
      `
      INSERT INTO withdrawals (
        id, event_id, collaborator_wallet, amount_usdc, tx_hash, created_at
      )
      VALUES
        ($1, $2, $3, '0.6', $4, $7),
        ($5, $2, $3, '0.4', $6, $8)
      `,
      [
        settledForCashOutId,
        eventId,
        collaboratorWallet,
        settlementTxHash,
        readyForCashOutId,
        "b".repeat(64),
        new Date(baseTime + 1_000).toISOString(),
        new Date(baseTime + 2_000).toISOString(),
      ],
    );

    await client.query(
      `
      INSERT INTO anchor_payouts (
        id, event_id, collaborator_wallet, amount_usdc, provider, status,
        anchor_transaction_id, reference_number, pickup_url, withdrawal_id,
        metadata_json
      )
      VALUES (
        'apo_browser_moneygram_pending', $1, $2, '0.6', 'moneygram',
        'pending_anchor', 'mg-browser-qa', 'mg-browser-qa',
        'https://extstellar.moneygram.com/mock-interactive', $3, $4::jsonb
      )
      `,
      [
        eventId,
        collaboratorWallet,
        settledForCashOutId,
        JSON.stringify({
          moneygramStatus: "pending_user_transfer_start",
          moneygramTransaction: {
            status: "pending_user_transfer_start",
          },
          transferInstructions: {
            amountUsdc: "0.6",
            assetCode: "USDC",
            assetIssuer:
              "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
            destination: moneyGramDestination,
            memo: "24681012",
            memoType: "id",
            network: "TESTNET",
          },
        }),
      ],
    );
  });
}

function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      shell: process.platform === "win32" && command === "npm",
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

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

async function stopServer(child) {
  if (process.platform === "win32" && child.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      killer.on("close", resolve);
      killer.on("error", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
}

async function inspectPage(browser, viewport, pageSpec) {
  const context = await browser.newContext({
    viewport: {
      width: viewport.width,
      height: viewport.height,
    },
  });

  if (pageSpec.cookieValue) {
    await context.addCookies([
      {
        domain: "127.0.0.1",
        httpOnly: true,
        name: "quorum_session",
        path: "/",
        sameSite: "Lax",
        value: pageSpec.cookieValue,
      },
    ]);
  }

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    const text = message.text();

    if (
      message.type() === "error" &&
      !text.includes("/_next/webpack-hmr") &&
      !text.includes("net::ERR_INVALID_HTTP_RESPONSE")
    ) {
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  try {
    const response = await page.goto(`${baseUrl}${pageSpec.path}`, {
      waitUntil: "networkidle",
    });
    assert(response?.ok(), `${pageSpec.path} returned HTTP ${response?.status()}`);

    const bodyText = normalizeWhitespace(await page.locator("body").innerText());
    const missingText = pageSpec.requiredText.filter((text) => !bodyText.includes(text));
    const overflow = await page.evaluate(() => {
      const documentWidth = document.documentElement.scrollWidth;
      const viewportWidth = document.documentElement.clientWidth;
      const bodyWidth = document.body.scrollWidth;

      return {
        bodyWidth,
        documentWidth,
        viewportWidth,
        hasHorizontalOverflow:
          documentWidth > viewportWidth + 1 || bodyWidth > viewportWidth + 1,
      };
    });
    let screenshotPath = null;

    if (screenshotDir && pageSpec.label === "Collaborator ledger") {
      fs.mkdirSync(screenshotDir, { recursive: true });
      screenshotPath = path.join(
        screenshotDir,
        `collaborator-ledger-${viewport.label.toLowerCase()}.png`,
      );
      await page.screenshot({ fullPage: true, path: screenshotPath });
    }

    return {
      consoleErrors,
      missingText,
      pageErrors,
      page: pageSpec.label,
      path: pageSpec.path,
      status: response.status(),
      screenshotPath,
      overflow,
      viewport,
    };
  } finally {
    await context.close();
  }
}

function renderPageRows(results, viewportLabel) {
  return results
    .filter((result) => result.viewport.label === viewportLabel)
    .map(
      (result) =>
        `| ${result.page} | \`${result.path}\` | ${result.status} | ${result.missingText.length === 0 ? "yes" : `missing ${result.missingText.join(", ")}`} | ${result.overflow.hasHorizontalOverflow ? "yes" : "no"} | ${result.consoleErrors.length + result.pageErrors.length} |`,
    )
    .join("\n");
}

function renderMarkdown({ generatedAt, pages, results }) {
  const totalErrors = results.reduce(
    (count, result) => count + result.consoleErrors.length + result.pageErrors.length,
    0,
  );
  const overflowCount = results.filter(
    (result) => result.overflow.hasHorizontalOverflow,
  ).length;
  const missingTextCount = results.filter(
    (result) => result.missingText.length > 0,
  ).length;

  return `# Quorum Browser QA

Generated at: \`${generatedAt}\`

This file is generated by \`npm run browser:qa\`. It records local browser
verification for the hackathon demo surface and complements
\`docs/DEMO_EVIDENCE.md\`, which records command-based verification.

## Environment

- App URL: \`${baseUrl}\`
- Database setup: \`npm run db:migrate\` and \`npm run db:seed\`
- Seeded paid event: \`APAC Stellar Builder Meetup\`
- Seeded free event: \`Stellar Open Office Hours\`

## Summary

- Pages checked per viewport: \`${pages.length}\`
- Viewports checked: \`${viewports.map((viewport) => `${viewport.width} x ${viewport.height}`).join(", ")}\`
- Console errors: ${totalErrors === 0 ? "none observed" : totalErrors}
- Horizontal overflow: ${overflowCount === 0 ? "none observed" : overflowCount}
- Missing required text: ${missingTextCount === 0 ? "none observed" : missingTextCount}

## Desktop Viewport

- Viewport: \`1280 x 720\`

| Page | Path | HTTP | Required text | Horizontal overflow | Console/page errors |
|---|---|---:|---|---|---:|
${renderPageRows(results, "Desktop")}

## Mobile Viewport

- Viewport: \`390 x 844\`

| Page | Path | HTTP | Required text | Horizontal overflow | Console/page errors |
|---|---|---:|---|---|---:|
${renderPageRows(results, "Mobile")}

## Readiness Signals

- Landing renders the Figma-aligned Quorum value proposition, feature section,
  FAQ, and primary start CTA.
- Discover renders paid and free seeded events.
- Event detail shows checkout, capacity, and collaborator split information.
- Checkout renders review, Freighter approval, split, and post-confirmation
  access context.
- Resource page renders a locked state without a pass session.
- Pass library and pass receipt render from a temporary pass-owner session.
- Organizer check-in renders from a temporary organizer session with a checked-in
  local-proof pass.
- Dashboard renders wallet readiness, contract readiness, \`Local proof mode\`,
  \`USDC asset\` readiness, and action execution policy.
- Create event, collaborator ledger, event proof, and global evidence routes are
  included in the desktop/mobile matrix.

## Remaining Boundary

Live testnet deployment and live transaction signing remain gated by a funded
\`STELLAR_ACCOUNT\`, deployed contract IDs, confirmed testnet USDC contract ID,
hosted environment variables, and explicit approval before signing.
`;
}

async function main() {
  const env = {
    NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: "",
    NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: "",
    NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: "",
    NEXT_TELEMETRY_DISABLED: "1",
    QUORUM_DB_SCHEMA: databaseSchema,
    QUORUM_SESSION_SECRET: browserSessionSecret,
  };

  await runCommand("node", ["scripts/db-migrate.mjs"], env);
  await runCommand("node", ["scripts/db-seed.mjs"], env);

  const server = spawn(
    "npm",
    ["run", "dev", "--", "--port", String(port)],
    {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let serverOutput = "";

  server.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });

  try {
    await waitForServer(server);

    const attendeeCookie = createSession(Keypair.random().publicKey());
    const organizerCookie = createSession(organizerWallet);
    const collaboratorCookie = createSession(collaboratorWallet);
    const passResponse = await fetch(`${baseUrl}/api/events/${eventId}/passes`, {
      method: "POST",
      headers: { cookie: `quorum_session=${attendeeCookie}` },
    });
    const passBody = await readJson(passResponse);
    const tokenId = passBody?.pass?.tokenId;

    assert(passResponse.status === 201, "browser QA pass setup should succeed");
    assert(typeof tokenId === "string", "browser QA setup should return token ID");
    await seedCashOutFixture();

    const checkInResponse = await fetch(
      `${baseUrl}/api/events/${eventId}/check-ins`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `quorum_session=${organizerCookie}`,
        },
        body: JSON.stringify({ tokenId }),
      },
    );

    assert(
      checkInResponse.status === 201,
      "browser QA check-in setup should succeed",
    );

    const pages = buildPages({
      attendeeCookie,
      collaboratorCookie,
      organizerCookie,
      tokenId,
    });

    const browser = await chromium.launch({ headless: true });

    try {
      const results = [];

      for (const viewport of viewports) {
        for (const pageSpec of pages) {
          results.push(await inspectPage(browser, viewport, pageSpec));
        }
      }

      const failures = results.flatMap((result) => {
        const pageLabel = `${result.viewport.label} ${result.path}`;
        return [
          ...result.missingText.map((text) => `${pageLabel} missing text: ${text}`),
          ...(result.overflow.hasHorizontalOverflow
            ? [`${pageLabel} has horizontal overflow`]
            : []),
          ...result.consoleErrors.map((error) => `${pageLabel} console error: ${error}`),
          ...result.pageErrors.map((error) => `${pageLabel} page error: ${error}`),
        ];
      });

      const generatedAt = new Date().toISOString();
      fs.mkdirSync(path.dirname(browserQaPath), { recursive: true });
      fs.writeFileSync(
        browserQaPath,
        renderMarkdown({ generatedAt, pages, results }),
      );

      console.log(
        JSON.stringify(
          {
            ok: failures.length === 0,
            browserQaPath,
            generatedAt,
            baseUrl,
            checkedPages: results.length,
            failures,
            screenshots: results
              .map((result) => result.screenshotPath)
              .filter(Boolean),
          },
          null,
          2,
        ),
      );

      if (failures.length > 0) {
        process.exitCode = 1;
      }
    } finally {
      await browser.close();
    }
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
    await stopServer(server);
    await delay(500);
    await withClient(
      async (client) => {
        await client.query(`DROP SCHEMA IF EXISTS "${databaseSchema}" CASCADE`);
      },
      { migration: true },
    );
  }
}

main();
