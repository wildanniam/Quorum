import { StrKey } from "@stellar/stellar-sdk";
import {
  resolveMoneyGramAnchorConfig,
  type MoneyGramAnchorConfig,
} from "@/lib/anchor/config";
import { usdcToAtomicUnits } from "@/lib/stellar/live-encoding";
import {
  fetchMoneyGramSep1Info,
  type MoneyGramSep1Info,
} from "@/lib/anchor/moneygram/sep1";

type MoneyGramSep24Fetcher = Pick<typeof globalThis, "fetch">["fetch"];

export type MoneyGramSep24Info = {
  deposit: Record<string, unknown>;
  fee: Record<string, unknown>;
  features: Record<string, unknown>;
  raw: Record<string, unknown>;
  withdraw: Record<string, unknown>;
};

export type MoneyGramSep24Withdrawal = {
  id: string | null;
  raw: Record<string, unknown>;
  type: string;
  url: string | null;
};

export type MoneyGramSep24Transaction = {
  amountIn: string | null;
  externalTransactionId: string | null;
  id: string;
  kind: string | null;
  message: string | null;
  moreInfoUrl: string | null;
  raw: Record<string, unknown>;
  status: string;
  stellarTransactionId: string | null;
  withdrawAnchorAccount: string | null;
  withdrawMemo: string | null;
  withdrawMemoType: string | null;
};

export type MoneyGramWithdrawalTransferInstructions = {
  amountUsdc: string;
  assetCode: "USDC";
  assetIssuer: string;
  destination: string;
  memo: string;
  memoType: "id";
  network: "TESTNET";
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

async function readJson(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function assertWalletAddress(walletAddress: string) {
  if (!StrKey.isValidEd25519PublicKey(walletAddress)) {
    throw new Error(`Invalid Stellar wallet address: ${walletAddress}`);
  }
}

function assertUsdcAmount(amountUsdc: string) {
  if (!/^\d+(\.\d{1,7})?$/.test(amountUsdc) || Number(amountUsdc) <= 0) {
    throw new Error("Enter a positive USDC amount with up to 7 decimals.");
  }
}

function bearerToken(value: string) {
  const token = value.trim();

  if (!token) {
    throw new Error("MoneyGram wallet authorization required.");
  }

  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

function responseError(payload: Record<string, unknown>, fallback: string) {
  return asString(payload.error) ?? asString(payload.message) ?? fallback;
}

function normalizeMoneyGramUrl(value: string | null, label: string) {
  if (!value) return null;

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} returned an invalid URL.`);
  }

  const hostname = url.hostname.toLowerCase();

  if (
    url.protocol !== "https:" ||
    (hostname !== "moneygram.com" && !hostname.endsWith(".moneygram.com"))
  ) {
    throw new Error(`${label} must use an HTTPS MoneyGram domain.`);
  }

  return url.toString();
}

function assertMemoId(value: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error("MoneyGram withdrawal memo must be a numeric Stellar memo id.");
  }

  const memo = BigInt(value);

  if (memo > BigInt("18446744073709551615")) {
    throw new Error("MoneyGram withdrawal memo exceeds the Stellar memo id limit.");
  }
}

export function getMoneyGramWithdrawalTransferInstructions({
  config = resolveMoneyGramAnchorConfig(),
  expectedAmountUsdc,
  transaction,
}: {
  config?: MoneyGramAnchorConfig;
  expectedAmountUsdc: string;
  transaction: MoneyGramSep24Transaction;
}): MoneyGramWithdrawalTransferInstructions | null {
  if (transaction.status.trim().toLowerCase() !== "pending_user_transfer_start") {
    return null;
  }

  if (transaction.kind && transaction.kind.toLowerCase() !== "withdrawal") {
    throw new Error("MoneyGram returned a non-withdrawal transaction.");
  }

  const amountUsdc = transaction.amountIn;
  const destination = transaction.withdrawAnchorAccount;
  const memo = transaction.withdrawMemo;
  const memoType = transaction.withdrawMemoType?.toLowerCase();

  if (!amountUsdc || !destination || !memo || !memoType) {
    throw new Error("MoneyGram transfer instructions are incomplete.");
  }

  if (!StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error("MoneyGram returned an invalid Stellar destination account.");
  }

  if (memoType !== "id") {
    throw new Error(`Unsupported MoneyGram withdrawal memo type: ${memoType}.`);
  }

  assertMemoId(memo);

  if (usdcToAtomicUnits(amountUsdc) !== usdcToAtomicUnits(expectedAmountUsdc)) {
    throw new Error("MoneyGram transfer amount does not match the settled USDC amount.");
  }

  return {
    amountUsdc,
    assetCode: config.usdcAssetCode,
    assetIssuer: config.usdcIssuer,
    destination,
    memo,
    memoType,
    network: "TESTNET",
  };
}

async function discoveryOrFetch({
  config,
  discovery,
  fetcher,
}: {
  config: MoneyGramAnchorConfig;
  discovery?: MoneyGramSep1Info;
  fetcher: MoneyGramSep24Fetcher;
}) {
  return discovery ?? fetchMoneyGramSep1Info({ config, fetcher });
}

export async function fetchMoneyGramSep24Info({
  config = resolveMoneyGramAnchorConfig(),
  discovery,
  fetcher = fetch,
}: {
  config?: MoneyGramAnchorConfig;
  discovery?: MoneyGramSep1Info;
  fetcher?: MoneyGramSep24Fetcher;
} = {}): Promise<MoneyGramSep24Info> {
  const sep1 = await discoveryOrFetch({ config, discovery, fetcher });
  const response = await fetcher(`${sep1.transferServerSep24}/info`, {
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const payload = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(
      responseError(
        payload,
        `MoneyGram SEP-24 info failed with HTTP ${response.status}.`,
      ),
    );
  }

  return {
    deposit: asRecord(payload.deposit),
    fee: asRecord(payload.fee),
    features: asRecord(payload.features),
    raw: payload,
    withdraw: asRecord(payload.withdraw),
  };
}

export async function initiateMoneyGramSep24Withdrawal({
  account,
  amountUsdc,
  authToken,
  config = resolveMoneyGramAnchorConfig(),
  discovery,
  fetcher = fetch,
  lang = "en",
}: {
  account: string;
  amountUsdc: string;
  authToken: string;
  config?: MoneyGramAnchorConfig;
  discovery?: MoneyGramSep1Info;
  fetcher?: MoneyGramSep24Fetcher;
  lang?: string;
}): Promise<MoneyGramSep24Withdrawal> {
  assertWalletAddress(account);
  assertUsdcAmount(amountUsdc);

  const sep1 = await discoveryOrFetch({ config, discovery, fetcher });
  const body = {
    account,
    amount: amountUsdc,
    asset_code: config.usdcAssetCode,
    asset_issuer: config.usdcIssuer,
    lang,
  };
  const response = await fetcher(
    `${sep1.transferServerSep24}/transactions/withdraw/interactive`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: bearerToken(authToken),
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(config.timeoutMs),
    },
  );
  const payload = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(
      responseError(
        payload,
        `MoneyGram SEP-24 withdrawal failed with HTTP ${response.status}.`,
      ),
    );
  }

  const type = asString(payload.type) ?? "unknown";
  const id = asString(payload.id);
  const url = normalizeMoneyGramUrl(
    asString(payload.url),
    "MoneyGram SEP-24 withdrawal",
  );

  if (type === "interactive_customer_info_needed" && (!id || !url)) {
    throw new Error("MoneyGram SEP-24 withdrawal response is incomplete.");
  }

  return {
    id,
    raw: payload,
    type,
    url,
  };
}

export async function fetchMoneyGramSep24Transaction({
  authToken,
  config = resolveMoneyGramAnchorConfig(),
  discovery,
  fetcher = fetch,
  id,
}: {
  authToken: string;
  config?: MoneyGramAnchorConfig;
  discovery?: MoneyGramSep1Info;
  fetcher?: MoneyGramSep24Fetcher;
  id: string;
}): Promise<MoneyGramSep24Transaction> {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new Error("MoneyGram transaction id is required.");
  }

  const sep1 = await discoveryOrFetch({ config, discovery, fetcher });
  const url = new URL(`${sep1.transferServerSep24}/transaction`);

  url.searchParams.set("id", trimmedId);

  const response = await fetcher(url, {
    headers: {
      Authorization: bearerToken(authToken),
    },
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const payload = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(
      responseError(
        payload,
        `MoneyGram SEP-24 transaction status failed with HTTP ${response.status}.`,
      ),
    );
  }

  const transaction = asRecord(payload.transaction);
  const transactionId = asString(transaction.id);
  const status = asString(transaction.status);

  if (!transactionId || !status) {
    throw new Error("MoneyGram SEP-24 transaction response is incomplete.");
  }

  return {
    amountIn: asString(transaction.amount_in),
    externalTransactionId: asString(transaction.external_transaction_id),
    id: transactionId,
    kind: asString(transaction.kind),
    message: asString(transaction.message),
    moreInfoUrl: normalizeMoneyGramUrl(
      asString(transaction.more_info_url),
      "MoneyGram SEP-24 transaction",
    ),
    raw: transaction,
    status,
    stellarTransactionId: asString(transaction.stellar_transaction_id),
    withdrawAnchorAccount: asString(transaction.withdraw_anchor_account),
    withdrawMemo: asString(transaction.withdraw_memo),
    withdrawMemoType: asString(transaction.withdraw_memo_type),
  };
}
