export const nonzeroPlatformFeeApprovalEnv =
  "QUORUM_NONZERO_PLATFORM_FEE_APPROVED";
export const nonzeroPlatformFeeApprovalValue = "I_APPROVE_NONZERO_PLATFORM_FEE";

export function hasNonzeroPlatformFeeApproval(env = process.env) {
  return env[nonzeroPlatformFeeApprovalEnv] === nonzeroPlatformFeeApprovalValue;
}

export function nonzeroPlatformFeeApprovalMessage() {
  return `Set ${nonzeroPlatformFeeApprovalEnv}=${nonzeroPlatformFeeApprovalValue} only after explicit product approval for a non-zero platform fee.`;
}

export function requirePlatformFeePolicy(platformFeeBps, env = process.env) {
  if (Number(platformFeeBps) > 0 && !hasNonzeroPlatformFeeApproval(env)) {
    console.error(nonzeroPlatformFeeApprovalMessage());
    process.exit(1);
  }
}
