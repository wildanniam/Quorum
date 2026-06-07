import { NextResponse } from "next/server";
import {
  getContractReadiness,
  getRpcServer,
  normalizeContractError,
} from "@/lib/stellar/contracts";

export async function GET() {
  const readiness = getContractReadiness();

  try {
    const network = await getRpcServer().getNetwork();

    return NextResponse.json({
      ...readiness,
      rpcReachable: true,
      rpcNetworkPassphrase: network.passphrase,
    });
  } catch (error) {
    return NextResponse.json({
      ...readiness,
      rpcReachable: false,
      rpcError: normalizeContractError(error),
    });
  }
}
