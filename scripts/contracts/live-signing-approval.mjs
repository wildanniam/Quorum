export const liveSigningApprovalEnv = "QUORUM_LIVE_SIGNING_APPROVED";
export const liveSigningApprovalValue = "I_APPROVE_TESTNET_SIGNING";

export function hasLiveSigningApproval(env = process.env) {
  return env[liveSigningApprovalEnv] === liveSigningApprovalValue;
}

export function liveSigningApprovalMessage() {
  return `Set ${liveSigningApprovalEnv}=${liveSigningApprovalValue} only after explicit approval for live testnet signing.`;
}

export function requireLiveSigningApproval(env = process.env) {
  if (hasLiveSigningApproval(env)) return;

  console.error(liveSigningApprovalMessage());
  process.exit(1);
}
