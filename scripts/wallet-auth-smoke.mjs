import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { Keypair } from "@stellar/stellar-sdk";

const projectRoot = process.cwd();
const port = Number(process.env.WALLET_AUTH_SMOKE_PORT ?? 3042);
const baseUrl = `http://127.0.0.1:${port}`;

function extractCookie(setCookieHeader, name) {
  if (!setCookieHeader) return null;

  const cookies = setCookieHeader.split(/,(?=\s*[^;,]+=)/);
  const cookie = cookies
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie?.split(";")[0] ?? null;
}

function stellarSignedMessageDigest(message) {
  return createHash("sha256")
    .update("Stellar Signed Message:\n")
    .update(message)
    .digest();
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
      const response = await fetch(`${baseUrl}/api/me`);
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
  const databaseUrl = `file:./data/quorum-wallet-auth-smoke-${randomUUID()}.db`;
  const server = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: "",
      NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: "",
      NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
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

    const invalidChallenge = await fetch(`${baseUrl}/api/auth/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ walletAddress: "not-a-wallet" }),
    });
    assert(invalidChallenge.status === 400, "invalid wallet should be rejected");

    const keypair = Keypair.random();
    const walletAddress = keypair.publicKey();
    const challengeResponse = await fetch(`${baseUrl}/api/auth/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    const challengeBody = await readJson(challengeResponse);
    const challengeCookie = extractCookie(
      challengeResponse.headers.get("set-cookie"),
      "quorum_challenge",
    );

    assert(challengeResponse.status === 200, "challenge should be issued");
    assert(
      typeof challengeBody?.message === "string" &&
        challengeBody.message.includes(`Wallet: ${walletAddress}`) &&
        challengeBody.message.includes("Network: Stellar Testnet"),
      "challenge should bind wallet and testnet network",
    );
    assert(challengeCookie, "challenge cookie should be set");
    assert(
      challengeCookie.includes("%0A"),
      "multiline challenge cookie should be safely encoded",
    );

    const signedMessage = keypair
      .sign(stellarSignedMessageDigest(challengeBody.message))
      .toString("base64");
    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: challengeCookie,
      },
      body: JSON.stringify({
        walletAddress,
        signerAddress: walletAddress,
        signedMessage,
        message: challengeBody.message,
      }),
    });
    const verifyBody = await readJson(verifyResponse);
    const sessionCookie = extractCookie(
      verifyResponse.headers.get("set-cookie"),
      "quorum_session",
    );

    assert(verifyResponse.status === 200, "signed challenge should verify");
    assert(
      verifyBody?.walletAddress === walletAddress,
      "verify route should return session wallet",
    );
    assert(sessionCookie, "session cookie should be set");

    const meResponse = await fetch(`${baseUrl}/api/me`, {
      headers: { cookie: sessionCookie },
    });
    const meBody = await readJson(meResponse);

    assert(meResponse.status === 200, "me route should render");
    assert(
      meBody?.walletAddress === walletAddress,
      "me route should read wallet session",
    );

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { cookie: sessionCookie },
    });
    assert(logoutResponse.status === 200, "logout should succeed");

    const loggedOutResponse = await fetch(`${baseUrl}/api/me`);
    const loggedOutBody = await readJson(loggedOutResponse);
    assert(
      loggedOutBody?.walletAddress === null,
      "me route should be empty without a session cookie",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          walletAddress,
          checks: [
            "reject-invalid-wallet-challenge-request",
            "issue-wallet-bound-challenge-cookie",
            "encode-multiline-challenge-cookie",
            "verify-signed-wallet-challenge",
            "set-wallet-session-cookie",
            "me-reads-wallet-session",
            "logout-clears-wallet-session",
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
  }
}

await main();
