import { NextResponse } from "next/server";
import {
  getContractReadiness,
  getRpcServer,
  normalizeContractError,
} from "@/lib/stellar/contracts";
import {
  CONTRACT_ACTIONS,
  getContractActionPolicy,
} from "@/lib/stellar/action-policy";

function getActionPolicies() {
  return CONTRACT_ACTIONS.map((action) => getContractActionPolicy(action));
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
