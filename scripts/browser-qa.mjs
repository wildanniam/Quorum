import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const projectRoot = process.cwd();
const browserQaPath = path.join(projectRoot, "docs", "BROWSER_QA.md");
const port = Number(process.env.BROWSER_QA_PORT ?? 3040);
const baseUrl = `http://127.0.0.1:${port}`;
const databaseUrl =
  process.env.BROWSER_QA_DATABASE_URL ??
  `file:./data/quorum-browser-qa-${randomUUID()}.db`;

const viewports = [
  { label: "Desktop", width: 1280, height: 720 },
  { label: "Mobile", width: 390, height: 844 },
];

const pages = [
  {
    label: "Marketplace",
    path: "/",
    requiredText: [
      "APAC Stellar Builder Meetup",
      "Stellar Open Office Hours",
      "5 USDC",
      "Free",
    ],
  },
  {
    label: "Paid event detail",
    path: "/events/apac-stellar-builder-meetup",
    requiredText: [
      "APAC Stellar Builder Meetup",
      "Buy pass",
      "70%",
      "20%",
      "10%",
    ],
  },
  {
    label: "Locked resources",
    path: "/events/apac-stellar-builder-meetup/resources",
    requiredText: ["Locked", "Connect the wallet", "Requires this event pass"],
  },
  {
    label: "Dashboard readiness",
    path: "/dashboard",
    requiredText: [
      "Transparency console",
      "Deployment pending",
      "Local proof mode",
      "USDC asset",
      "Missing",
      "Action execution",
      "local proof",
    ],
  },
];

function resolveDatabasePath() {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("browser QA expects a file: SQLite DATABASE_URL");
  }

  return path.resolve(projectRoot, databaseUrl.replace(/^file:/, ""));
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

async function inspectPage(browser, viewport, pageSpec) {
  const context = await browser.newContext({
    viewport: {
      width: viewport.width,
      height: viewport.height,
    },
  });
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

    return {
      consoleErrors,
      missingText,
      pageErrors,
      page: pageSpec.label,
      path: pageSpec.path,
      status: response.status(),
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

function renderMarkdown({ generatedAt, results }) {
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

- Marketplace renders paid and free seeded events.
- Event detail shows checkout, capacity, and collaborator split information.
- Resource page renders a locked state without a pass session.
- Dashboard renders wallet readiness, contract readiness, \`Local proof mode\`,
  \`USDC asset\` readiness, and action execution policy.

## Remaining Boundary

Live testnet deployment and live transaction signing remain gated by a funded
\`STELLAR_ACCOUNT\`, deployed contract IDs, confirmed testnet USDC contract ID,
hosted environment variables, and explicit approval before signing.
`;
}

async function main() {
  const databasePath = resolveDatabasePath();
  fs.rmSync(databasePath, { force: true });
  fs.rmSync(`${databasePath}-shm`, { force: true });
  fs.rmSync(`${databasePath}-wal`, { force: true });

  const env = {
    DATABASE_URL: databaseUrl,
    NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: "",
    NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: "",
    NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: "",
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
      fs.writeFileSync(browserQaPath, renderMarkdown({ generatedAt, results }));

      console.log(
        JSON.stringify(
          {
            ok: failures.length === 0,
            browserQaPath,
            generatedAt,
            baseUrl,
            checkedPages: results.length,
            failures,
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
    server.kill("SIGTERM");
    await delay(500);
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
    fs.rmSync(`${databasePath}-wal`, { force: true });
  }
}

main();
