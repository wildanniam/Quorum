import {
  Keypair,
  Networks,
  StrKey,
  Transaction,
  TransactionBuilder,
  type OperationRecord,
} from "@stellar/stellar-sdk";
import {
  assertMoneyGramSigningSecret,
  resolveMoneyGramAnchorConfig,
  type MoneyGramAnchorConfig,
} from "@/lib/anchor/config";
import {
  fetchMoneyGramSep1Info,
  type MoneyGramSep1Info,
} from "@/lib/anchor/moneygram/sep1";

type MoneyGramAuthFetcher = Pick<typeof globalThis, "fetch">["fetch"];

export type MoneyGramSep10Challenge = {
  account: string;
  clientDomain: string;
  homeDomain: string;
  networkPassphrase: string;
  serverSigningKey: string;
  transactionXdr: string;
  webAuthEndpoint: string;
};

export type MoneyGramSep10Token = {
  token: string;
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

function getManageDataOperationValue(operation: OperationRecord) {
  if (operation.type !== "manageData") return null;
  if (!operation.value) return null;

  return operation.value.toString();
}

function hasValidSignature(transaction: Transaction, publicKey: string) {
  const keypair = Keypair.fromPublicKey(publicKey);
  const hint = keypair.signatureHint();
  const hash = transaction.hash();

  return transaction.signatures.some((signature) => {
    if (!signature.hint().equals(hint)) return false;

    return keypair.verify(hash, signature.signature());
  });
}

function hasClientDomainOperation({
  config,
  transaction,
}: {
  config: MoneyGramAnchorConfig;
  transaction: Transaction;
}) {
  return transaction.operations.some((operation) => {
    if (operation.type !== "manageData") return false;

    return (
      operation.source === config.clientSigningPublicKey &&
      operation.name.toString() === "client_domain" &&
      getManageDataOperationValue(operation) === config.clientDomain
    );
  });
}

function assertChallengeMatchesRequest({
  account,
  config,
  networkPassphrase,
  serverSigningKey,
  transaction,
}: {
  account: string;
  config: MoneyGramAnchorConfig;
  networkPassphrase: string;
  serverSigningKey?: string;
  transaction: Transaction;
}) {
  if (networkPassphrase !== Networks.TESTNET) {
    throw new Error("MoneyGram SEP-10 challenge must use Stellar testnet.");
  }

  const hasAccountOperation = transaction.operations.some(
    (operation) => operation.type === "manageData" && operation.source === account,
  );

  if (!hasAccountOperation) {
    throw new Error("MoneyGram SEP-10 challenge does not include the wallet account.");
  }

  if (!hasClientDomainOperation({ config, transaction })) {
    throw new Error(
      "MoneyGram SEP-10 challenge does not include Quorum client-domain proof.",
    );
  }

  if (serverSigningKey) {
    if (transaction.source !== serverSigningKey) {
      throw new Error(
        "MoneyGram SEP-10 challenge source does not match SEP-1 SIGNING_KEY.",
      );
    }

    if (!hasValidSignature(transaction, serverSigningKey)) {
      throw new Error("MoneyGram SEP-10 challenge is not signed by MoneyGram.");
    }
  }
}

function parseChallengeTransaction({
  account,
  config,
  networkPassphrase,
  serverSigningKey,
  transactionXdr,
}: {
  account: string;
  config: MoneyGramAnchorConfig;
  networkPassphrase: string;
  serverSigningKey?: string;
  transactionXdr: string;
}) {
  let transaction: Transaction;

  try {
    const parsed = TransactionBuilder.fromXDR(transactionXdr, networkPassphrase);

    if (!(parsed instanceof Transaction)) {
      throw new Error("Fee bump transactions are not valid SEP-10 challenges.");
    }

    transaction = parsed;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not parse MoneyGram SEP-10 challenge: ${error.message}`
        : "Could not parse MoneyGram SEP-10 challenge.",
    );
  }

  assertChallengeMatchesRequest({
    account,
    config,
    networkPassphrase,
    serverSigningKey,
    transaction,
  });

  return transaction;
}

export function assertMoneyGramSep10SignedChallenge({
  account,
  config = resolveMoneyGramAnchorConfig(),
  networkPassphrase = Networks.TESTNET,
  requireClientDomainSignature = true,
  requireWalletSignature = true,
  serverSigningKey,
  transactionXdr,
}: {
  account: string;
  config?: MoneyGramAnchorConfig;
  networkPassphrase?: string;
  requireClientDomainSignature?: boolean;
  requireWalletSignature?: boolean;
  serverSigningKey?: string;
  transactionXdr: string;
}) {
  const transaction = parseChallengeTransaction({
    account,
    config,
    networkPassphrase,
    serverSigningKey,
    transactionXdr,
  });

  if (
    requireClientDomainSignature &&
    !hasValidSignature(transaction, config.clientSigningPublicKey)
  ) {
    throw new Error(
      "MoneyGram SEP-10 challenge is not signed by Quorum client-domain key.",
    );
  }

  if (requireWalletSignature && !hasValidSignature(transaction, account)) {
    throw new Error("MoneyGram SEP-10 challenge is not signed by the wallet.");
  }

  return transaction;
}

async function discoveryOrFetch({
  config,
  discovery,
  fetcher,
}: {
  config: MoneyGramAnchorConfig;
  discovery?: MoneyGramSep1Info;
  fetcher: MoneyGramAuthFetcher;
}) {
  return discovery ?? fetchMoneyGramSep1Info({ config, fetcher });
}

export async function requestMoneyGramSep10Challenge({
  account,
  config = resolveMoneyGramAnchorConfig(),
  discovery,
  fetcher = fetch,
}: {
  account: string;
  config?: MoneyGramAnchorConfig;
  discovery?: MoneyGramSep1Info;
  fetcher?: MoneyGramAuthFetcher;
}): Promise<MoneyGramSep10Challenge> {
  assertWalletAddress(account);

  const sep1 = await discoveryOrFetch({ config, discovery, fetcher });
  const url = new URL(sep1.webAuthEndpoint);

  url.searchParams.set("account", account);
  url.searchParams.set("client_domain", config.clientDomain);

  const response = await fetcher(url, {
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const payload = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(
      asString(payload.error) ??
        `MoneyGram SEP-10 challenge failed with HTTP ${response.status}.`,
    );
  }

  const transactionXdr = asString(payload.transaction);
  const networkPassphrase = asString(payload.network_passphrase);

  if (!transactionXdr || !networkPassphrase) {
    throw new Error("MoneyGram SEP-10 challenge response is incomplete.");
  }

  parseChallengeTransaction({
    account,
    config,
    networkPassphrase,
    serverSigningKey: sep1.signingKey,
    transactionXdr,
  });

  return {
    account,
    clientDomain: config.clientDomain,
    homeDomain: config.homeDomain,
    networkPassphrase,
    serverSigningKey: sep1.signingKey,
    transactionXdr,
    webAuthEndpoint: sep1.webAuthEndpoint,
  };
}

export function signMoneyGramClientDomainChallenge({
  challenge,
  config = resolveMoneyGramAnchorConfig(),
}: {
  challenge: MoneyGramSep10Challenge;
  config?: MoneyGramAnchorConfig;
}) {
  assertMoneyGramSigningSecret(config);

  const signingKeypair = Keypair.fromSecret(config.clientSigningSecret);

  if (signingKeypair.publicKey() !== config.clientSigningPublicKey) {
    throw new Error(
      "ANCHOR_CLIENT_SIGNING_SECRET does not match ANCHOR_CLIENT_SIGNING_PUBLIC_KEY.",
    );
  }

  const transaction = parseChallengeTransaction({
    account: challenge.account,
    config,
    networkPassphrase: challenge.networkPassphrase,
    serverSigningKey: challenge.serverSigningKey,
    transactionXdr: challenge.transactionXdr,
  });

  transaction.sign(signingKeypair);

  assertMoneyGramSep10SignedChallenge({
    account: challenge.account,
    config,
    networkPassphrase: challenge.networkPassphrase,
    requireWalletSignature: false,
    serverSigningKey: challenge.serverSigningKey,
    transactionXdr: transaction.toXDR(),
  });

  return transaction.toXDR();
}

export async function authenticateMoneyGramSep10({
  config = resolveMoneyGramAnchorConfig(),
  discovery,
  fetcher = fetch,
  signedTransactionXdr,
}: {
  config?: MoneyGramAnchorConfig;
  discovery?: MoneyGramSep1Info;
  fetcher?: MoneyGramAuthFetcher;
  signedTransactionXdr: string;
}): Promise<MoneyGramSep10Token> {
  const sep1 = await discoveryOrFetch({ config, discovery, fetcher });
  const response = await fetcher(sep1.webAuthEndpoint, {
    body: JSON.stringify({ transaction: signedTransactionXdr }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const payload = asRecord(await readJson(response));

  if (!response.ok) {
    throw new Error(
      asString(payload.error) ??
        `MoneyGram SEP-10 auth failed with HTTP ${response.status}.`,
    );
  }

  const token = asString(payload.token);

  if (!token) {
    throw new Error("MoneyGram SEP-10 auth did not return a token.");
  }

  return { token };
}
