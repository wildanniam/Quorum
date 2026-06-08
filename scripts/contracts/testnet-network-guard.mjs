export const testnetDeploymentNetwork = "testnet";

export function normalizeTestnetDeploymentNetwork(value = testnetDeploymentNetwork) {
  const network = String(value ?? "").trim();

  if (network.toLowerCase() !== testnetDeploymentNetwork) {
    throw new Error(testnetDeploymentNetworkMessage(network));
  }

  return testnetDeploymentNetwork;
}

export function isTestnetDeploymentNetwork(value = testnetDeploymentNetwork) {
  try {
    normalizeTestnetDeploymentNetwork(value);
    return true;
  } catch {
    return false;
  }
}

export function testnetDeploymentNetworkMessage(value = "") {
  const suffix = value ? ` Received STELLAR_NETWORK=${value}.` : "";

  return `Quorum contract deployment is locked to Stellar testnet. Set STELLAR_NETWORK=${testnetDeploymentNetwork} for the approved hackathon deployment.${suffix}`;
}

export function requireTestnetDeploymentNetwork(value = process.env.STELLAR_NETWORK) {
  try {
    return normalizeTestnetDeploymentNetwork(value ?? testnetDeploymentNetwork);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
