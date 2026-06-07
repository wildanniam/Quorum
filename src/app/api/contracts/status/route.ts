import { NextResponse } from "next/server";
import {
  getContractReadiness,
  getRpcServer,
  normalizeContractError,
} from "@/lib/stellar/contracts";
import { getContractActionPolicy } from "@/lib/stellar/action-policy";

const contractActions = [
  "publish_event",
  "checkout_pass",
  "check_in_pass",
  "withdraw_balance",
] as const;

function getActionPolicies() {
  return contractActions.map((action) => getContractActionPolicy(action));
}

export async function GET() {
  const readiness = getContractReadiness();

  try {
    const network = await getRpcServer().getNetwork();

    return NextResponse.json({
      ...readiness,
      actions: getActionPolicies(),
      rpcReachable: true,
      rpcNetworkPassphrase: network.passphrase,
    });
  } catch (error) {
    return NextResponse.json({
      ...readiness,
      actions: getActionPolicies(),
      rpcReachable: false,
      rpcError: normalizeContractError(error),
    });
  }
}
