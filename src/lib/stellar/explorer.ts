const HEX_64_PATTERN = /^[a-f0-9]{64}$/i;

export function isLiveTransactionHash(value: string | null | undefined) {
  return Boolean(value && HEX_64_PATTERN.test(value));
}

export function stellarExpertTransactionUrl(txHash: string | null | undefined) {
  if (!isLiveTransactionHash(txHash)) return null;

  return `https://stellar.expert/explorer/testnet/tx/${txHash?.toLowerCase()}`;
}
