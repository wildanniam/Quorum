import { spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  createFutureEventWindow,
  createPastEventWindow,
} from "./demo-event-schedule.mjs";
import { Keypair } from "@stellar/stellar-sdk";
import { withClient } from "./postgres-utils.mjs";

const projectRoot = process.cwd();
const port = Number(process.env.DEMO_SMOKE_PORT ?? 3035);
const baseUrl = `http://127.0.0.1:${port}`;
const readinessUrl = `${baseUrl}/api/contracts/status`;
const databaseSchema =
  process.env.DEMO_SMOKE_DB_SCHEMA ??
  `quorum_demo_smoke_${randomUUID().replaceAll("-", "_")}`;
const eventId = "evt_apac_stellar_builder_meetup";
const eventSlug = "apac-stellar-builder-meetup";
const freeEventId = "evt_stellar_open_office_hours";
const freeEventSlug = "stellar-open-office-hours";
const organizerWallet =
  "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet =
  "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const smokeSessionSecret = "quorum-local-dev-session-secret";

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
      process.env.DEMO_SMOKE_SESSION_SECRET ?? smokeSessionSecret,
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
      const response = await fetch(readinessUrl);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(400);
  }

  throw new Error(`Timed out waiting for ${readinessUrl}: ${lastError}`);
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createDraftPayload({
  title,
  collaboratorSplits = [70, 30],
  includeResource = true,
}) {
  const schedule = createFutureEventWindow({ durationHours: 2, offsetDays: 21 });

  return {
    title,
    eventType: "workshop",
    shortDescription:
      "A smoke-test event that verifies Quorum draft validation and publish lifecycle.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
    startDateTime: schedule.startDateTime,
    endDateTime: schedule.endDateTime,
    timezone: "Asia/Jakarta",
    locationType: "hybrid",
    locationText: "Jakarta + livestream",
    meetingUrl: "https://example.com/quorum-smoke",
    isFree: false,
    priceUsdc: "7",
    capacity: 42,
    collaborators: collaboratorSplits.map((splitPercentage, index) => ({
      displayName: index === 0 ? "Smoke Host" : "Smoke Speaker",
      role: index === 0 ? "Host" : "Speaker",
      walletAddress: index === 0 ? organizerWallet : speakerWallet,
      splitPercentage,
    })),
    resources: includeResource
      ? [
          {
            title: "Smoke Resource",
            description: "Gated resource used by the demo smoke test.",
            type: "link",
            url: "https://example.com/quorum-smoke-resource",
            sortOrder: 1,
          },
        ]
      : [],
  };
}

async function main() {
  const env = {
    NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: "",
    NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: "",
    NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: "",
    NEXT_TELEMETRY_DISABLED: "1",
    QUORUM_DB_SCHEMA: databaseSchema,
    QUORUM_SESSION_SECRET: process.env.DEMO_SMOKE_SESSION_SECRET ?? smokeSessionSecret,
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

    const attendeeWallet = Keypair.random().publicKey();
    const attendeeCookie = `quorum_session=${createSession(attendeeWallet)}`;
    const organizerCookie = `quorum_session=${createSession(organizerWallet)}`;
    const speakerCookie = `quorum_session=${createSession(speakerWallet)}`;

    const marketplace = await fetch(`${baseUrl}/discover`);
    const marketplaceHtml = await marketplace.text();
    assert(marketplace.status === 200, "marketplace should render");
    assert(
      marketplaceHtml.includes("APAC Stellar Builder Meetup"),
      "marketplace should include seeded event",
    );
    assert(
      marketplaceHtml.includes("Stellar Open Office Hours"),
      "marketplace should include seeded free event",
    );

    const eventPage = await fetch(`${baseUrl}/events/${eventSlug}`);
    const eventHtml = await eventPage.text();
    assert(eventPage.status === 200, "event detail should render");
    assert(eventHtml.includes("/checkout"), "event page should link checkout");

    const freeEventPage = await fetch(`${baseUrl}/events/${freeEventSlug}`);
    const freeEventHtml = await freeEventPage.text();
    assert(freeEventPage.status === 200, "free event detail should render");
    assert(freeEventHtml.includes("Claim pass"), "free event should show claim CTA");

    const draftTitle = `Smoke Publish ${randomUUID().slice(0, 8)}`;
    const invalidDraft = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: organizerCookie,
      },
      body: JSON.stringify(
        createDraftPayload({
          title: `${draftTitle} Invalid Split`,
          collaboratorSplits: [70, 20],
        }),
      ),
    });
    const invalidDraftBody = await readJson(invalidDraft);
    assert(invalidDraft.status === 400, "invalid split draft should fail");
    assert(
      invalidDraftBody?.issues?.some(
        (issue) =>
          issue.path === "collaborators" &&
          issue.message.includes("split total"),
      ),
      "invalid split draft should report split total issue",
    );

    const draft = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: organizerCookie,
      },
      body: JSON.stringify(createDraftPayload({ title: draftTitle })),
    });
    const draftBody = await readJson(draft);
    const draftEventId = draftBody?.event?.id;
    const draftSlug = draftBody?.event?.slug;
    assert(draft.status === 201, "valid draft should be created");
    assert(typeof draftEventId === "string", "draft should return event ID");
    assert(draftBody?.event?.status === "draft", "created event should be draft");
    assert(
      Array.isArray(draftBody?.resources) && draftBody.resources.length === 1,
      "draft should include gated resource setup",
    );

    const unauthorizedPublish = await fetch(
      `${baseUrl}/api/events/${draftEventId}/publish`,
      {
        method: "POST",
        headers: { cookie: attendeeCookie },
      },
    );
    assert(
      unauthorizedPublish.status === 400,
      "non-organizer should not publish draft",
    );

    const publish = await fetch(`${baseUrl}/api/events/${draftEventId}/publish`, {
      method: "POST",
      headers: { cookie: organizerCookie },
    });
    const publishBody = await readJson(publish);
    assert(publish.status === 200, "organizer should publish valid draft");
    assert(
      publishBody?.event?.status === "published",
      "published event should update status",
    );
    assert(
      publishBody?.event?.publishTxHash?.startsWith("stub:publish:"),
      "published event should record publish proof",
    );
    assert(
      publishBody?.executionMode === "local_proof",
      "publish should declare local proof execution mode",
    );

    const duplicatePublish = await fetch(
      `${baseUrl}/api/events/${draftEventId}/publish`,
      {
        method: "POST",
        headers: { cookie: organizerCookie },
      },
    );
    assert(duplicatePublish.status === 400, "published event should not republish");

    const expiredDraftPayload = createDraftPayload({
      title: `Expired Draft ${randomUUID().slice(0, 8)}`,
    });
    expiredDraftPayload.startDateTime = "2026-01-01T10:00:00.000Z";
    expiredDraftPayload.endDateTime = "2026-01-01T12:00:00.000Z";
    const expiredDraft = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: organizerCookie,
      },
      body: JSON.stringify(expiredDraftPayload),
    });
    const expiredDraftBody = await readJson(expiredDraft);
    assert(expiredDraft.status === 201, "expired draft should remain recoverable as a draft");
    const expiredPublish = await fetch(
      `${baseUrl}/api/events/${expiredDraftBody?.event?.id}/publish`,
      {
        method: "POST",
        headers: { cookie: organizerCookie },
      },
    );
    const expiredPublishBody = await readJson(expiredPublish);
    assert(expiredPublish.status === 400, "expired draft should not publish");
    assert(
      expiredPublishBody?.error?.includes("end time has passed"),
      "expired publish should explain the lifecycle boundary",
    );

    const publishedDraftPage = await fetch(`${baseUrl}/events/${draftSlug}`);
    const publishedDraftHtml = await publishedDraftPage.text();
    assert(publishedDraftPage.status === 200, "published draft page should render");
    assert(
      publishedDraftHtml.includes(draftTitle),
      "published draft should be publicly visible",
    );

    const contractStatus = await fetch(`${baseUrl}/api/contracts/status`);
    const contractStatusBody = await readJson(contractStatus);
    assert(contractStatus.status === 200, "contract status should render");
    assert(
      contractStatusBody?.proofMode === "local",
      "contract status should expose local proof mode before deployment",
    );
    assert(
      contractStatusBody?.configured === false,
      "contract status should remain unconfigured without live IDs",
    );
    assert(
      contractStatusBody?.paymentAssetConfigured === false &&
        contractStatusBody?.missing?.includes("NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID"),
      "contract status should report missing payment asset before live signing",
    );
    assert(
      contractStatusBody?.actions?.every(
        (action) => action.executionMode === "local_proof",
      ),
      "contract status should declare local proof actions before deployment",
    );

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
    assert(
      checkoutBody?.executionMode === "local_proof",
      "checkout should declare local proof execution mode",
    );

    const duplicateCheckout = await fetch(
      `${baseUrl}/api/events/${eventId}/passes`,
      {
        method: "POST",
        headers: { cookie: attendeeCookie },
      },
    );
    assert(duplicateCheckout.status === 409, "duplicate checkout should fail");

    const freeAttendeeWallet = Keypair.random().publicKey();
    const freeAttendeeCookie = `quorum_session=${createSession(freeAttendeeWallet)}`;
    const freeClaim = await fetch(
      `${baseUrl}/api/events/${freeEventId}/passes`,
      {
        method: "POST",
        headers: { cookie: freeAttendeeCookie },
      },
    );
    const freeClaimBody = await readJson(freeClaim);
    assert(freeClaim.status === 201, "free event claim should create a pass");
    assert(
      freeClaimBody?.pass?.source === "free_claim",
      "free event pass should use free_claim source",
    );
    assert(
      freeClaimBody?.purchase?.amountUsdc === "0",
      "free event claim should record zero USDC",
    );
    assert(
      freeClaimBody?.purchase?.txHash?.startsWith("stub:free_claim:"),
      "free claim should record claim proof",
    );
    assert(
      freeClaimBody?.executionMode === "local_proof",
      "free claim should declare local proof execution mode",
    );

    const duplicateFreeClaim = await fetch(
      `${baseUrl}/api/events/${freeEventId}/passes`,
      {
        method: "POST",
        headers: { cookie: freeAttendeeCookie },
      },
    );
    assert(duplicateFreeClaim.status === 409, "duplicate free claim should fail");

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
      unlockedHtml.toLowerCase().includes("unlocked"),
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
    assert(
      checkInBody?.executionMode === "local_proof",
      "check-in should declare local proof execution mode",
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
    assert(
      passHtml.includes("Local proof"),
      "pass page should label local proof records",
    );
    assert(
      passHtml.includes("Metadata"),
      "pass page should label metadata hash",
    );

    const checkInPage = await fetch(`${baseUrl}/check-in/${eventId}`, {
      headers: { cookie: organizerCookie },
    });
    const checkInHtml = await checkInPage.text();
    assert(checkInPage.status === 200, "check-in page should render");
    assert(
      checkInHtml.includes("Check-in proof"),
      "check-in page should show proof records",
    );
    assert(
      checkInHtml.includes("Local proof"),
      "check-in page should label local proof records",
    );

    const withdrawal = await fetch(
      `${baseUrl}/api/events/${eventId}/withdrawals`,
      {
        method: "POST",
        headers: { cookie: speakerCookie },
      },
    );
    const withdrawalBody = await readJson(withdrawal);
    assert(withdrawal.status === 201, "collaborator withdrawal should succeed");
    assert(
      withdrawalBody?.withdrawal?.amountUsdc === "1",
      "speaker should withdraw 20% of 5 USDC",
    );
    assert(
      withdrawalBody?.withdrawal?.txHash?.startsWith("stub:withdraw:"),
      "withdrawal should record proof hash",
    );
    assert(
      withdrawalBody?.executionMode === "local_proof",
      "withdrawal should declare local proof execution mode",
    );

    const duplicateWithdrawal = await fetch(
      `${baseUrl}/api/events/${eventId}/withdrawals`,
      {
        method: "POST",
        headers: { cookie: speakerCookie },
      },
    );
    assert(
      duplicateWithdrawal.status === 409,
      "duplicate withdrawal should fail when balance is empty",
    );

    const endedEventWindow = createPastEventWindow({ durationHours: 3 });

    await withClient(
      (client) =>
        client.query(
          `
          UPDATE "${databaseSchema}".events
          SET start_date_time = $1, end_date_time = $2
          WHERE id = $3
          `,
          [
            endedEventWindow.startDateTime,
            endedEventWindow.endDateTime,
            eventId,
          ],
        ),
      { migration: true },
    );

    const endedAttendeeCookie = `quorum_session=${createSession(Keypair.random().publicKey())}`;
    const endedCheckout = await fetch(`${baseUrl}/api/events/${eventId}/passes`, {
      method: "POST",
      headers: { cookie: endedAttendeeCookie },
    });
    const endedCheckoutBody = await readJson(endedCheckout);
    assert(endedCheckout.status === 409, "ended event checkout should fail");
    assert(
      endedCheckoutBody?.error?.includes("sales are closed"),
      "ended checkout should explain that pass sales are closed",
    );

    const endedEventPage = await fetch(`${baseUrl}/events/${eventSlug}`);
    const endedEventHtml = await endedEventPage.text();
    assert(endedEventHtml.includes("Event ended"), "event detail should label ended events");
    assert(
      endedEventHtml.includes("Browse upcoming events"),
      "ended event detail should replace the checkout CTA",
    );

    const endedCheckoutPage = await fetch(`${baseUrl}/events/${eventSlug}/checkout`);
    const endedCheckoutHtml = await endedCheckoutPage.text();
    assert(
      endedCheckoutHtml.includes("Pass sales closed"),
      "ended checkout page should be visibly non-actionable",
    );

    const discoverAfterEnd = await fetch(`${baseUrl}/discover`);
    const discoverAfterEndHtml = await discoverAfterEnd.text();
    assert(
      !discoverAfterEndHtml.includes("APAC Stellar Builder Meetup"),
      "Discover should exclude ended events",
    );

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
    assert(dashboardHtml.includes("Event ended"), "dashboard should label ended events");
    assert(
      dashboardHtml.includes("Local proof mode"),
      "dashboard should show local proof mode before live contracts",
    );
    assert(
      dashboardHtml.includes("USDC asset") && dashboardHtml.includes("Missing"),
      "dashboard should show missing USDC payment asset before live signing",
    );
    assert(
      dashboardHtml.includes("Wallet actions"),
      "dashboard should show contract action execution policy",
    );
    assert(
      dashboardHtml.includes("Checkout / claim") &&
        dashboardHtml.includes("local proof"),
      "dashboard should show local proof action rows",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          databaseSchema,
          eventId,
          tokenId,
          checks: [
            "marketplace",
            "event-detail",
            "draft-validation",
            "publish-lifecycle",
            "expired-publish-guard",
            "contract-status",
            "payment-asset-status",
            "contract-action-policy",
            "checkout",
            "duplicate-checkout-guard",
            "free-claim",
            "duplicate-free-claim-guard",
            "resource-gating",
            "organizer-check-in",
            "duplicate-check-in-guard",
            "proof-labels",
            "collaborator-withdraw",
            "duplicate-withdraw-guard",
            "ended-checkout-guard",
            "ended-event-ui",
            "discover-ended-filter",
            "pass-page",
            "dashboard-proof",
            "dashboard-payment-asset-readiness",
            "dashboard-action-policy",
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

await main();
