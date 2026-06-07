import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const requiredWiring = [
  {
    action: "publish_event",
    component: "src/components/events/create-event-form.tsx",
    label: "publish-live-ui-wiring",
  },
  {
    action: "checkout_pass",
    component: "src/components/events/checkout-panel.tsx",
    label: "checkout-live-ui-wiring",
  },
  {
    action: "check_in_pass",
    component: "src/components/events/check-in-panel.tsx",
    label: "check-in-live-ui-wiring",
  },
  {
    action: "withdraw_balance",
    component: "src/components/events/withdraw-button.tsx",
    label: "withdraw-live-ui-wiring",
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const helper = read("src/lib/stellar/live-browser-flow.ts");
const checks = [];

assert(
  helper.includes("/contract-action/preflight") &&
    helper.includes("/contract-action"),
  "live browser helper must call preflight and submit routes.",
);
checks.push("browser-helper-preflight-submit-routes");

for (const item of requiredWiring) {
  const source = read(item.component);

  assert(
    source.includes("executeLiveBrowserContractAction"),
    `${item.component} must import/use executeLiveBrowserContractAction.`,
  );
  assert(
    source.includes(`action: "${item.action}"`),
    `${item.component} must submit ${item.action}.`,
  );
  assert(
    source.includes('executionMode === "live_required"'),
    `${item.component} must gate fallback on live_required.`,
  );
  checks.push(item.label);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checks,
    },
    null,
    2,
  ),
);
