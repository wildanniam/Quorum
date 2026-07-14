import { runStellarEventIndexer } from "../src/lib/stellar/indexer";

const bareArgs = process.argv
  .slice(2)
  .filter((value) => !value.startsWith("--"));

function consumeBareArg() {
  return bareArgs.shift() ?? null;
}

function parseInteger(value: string | null, label: string) {
  if (!value || !/^\d+$/.test(value)) {
    throw new Error(`${label} requires a non-negative integer.`);
  }

  return Number(value);
}

function flagValue(flag: string) {
  const equalsPrefix = `${flag}=`;
  const inline = process.argv.find((value) => value.startsWith(equalsPrefix));

  if (inline) return inline.slice(equalsPrefix.length);

  const index = process.argv.indexOf(flag);
  if (index === -1) return null;

  return process.argv[index + 1] ?? null;
}

function npmConfigValue(name: string) {
  const value = process.env[`npm_config_${name}`];

  if (!value || value === "false") return null;
  if (value === "true") return consumeBareArg();

  return value;
}

function integerArg(flag: string, npmConfigName: string) {
  const value = flagValue(flag) ?? npmConfigValue(npmConfigName);

  return value === null ? null : parseInteger(value, flag);
}

function stringArg(flag: string, npmConfigName: string) {
  const value = flagValue(flag) ?? npmConfigValue(npmConfigName);

  if (value === null) return null;
  if (!value) throw new Error(`${flag} requires a value.`);

  return value;
}

async function main() {
  const result = await runStellarEventIndexer({
    cursor: stringArg("--cursor", "cursor"),
    limit: integerArg("--limit", "limit") ?? undefined,
    startLedger: integerArg("--start-ledger", "start_ledger"),
    stateId: stringArg("--state-id", "state_id") ?? undefined,
  });

  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
