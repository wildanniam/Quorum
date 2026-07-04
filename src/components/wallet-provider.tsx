"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StrKey } from "@stellar/stellar-sdk";

type WalletState = {
  status: "idle" | "checking" | "connected" | "error" | "unavailable";
  walletAddress: string | null;
  sessionWalletAddress: string | null;
  network: string | null;
  networkPassphrase: string | null;
  sorobanRpcUrl: string | null;
  error: string | null;
};

type WalletContextValue = WalletState & {
  connectAndSignIn: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const initialState: WalletState = {
  status: "idle",
  walletAddress: null,
  sessionWalletAddress: null,
  network: null,
  networkPassphrase: null,
  sorobanRpcUrl: null,
  error: null,
};

function normalizeError(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (error && typeof error === "object" && "error" in error) {
    return normalizeError((error as { error: unknown }).error);
  }
  if (error && typeof error === "object" && "errorMessage" in error) {
    return String((error as { errorMessage: unknown }).errorMessage);
  }
  return "Wallet request failed.";
}

function normalizeSignedMessage(signature: string | Buffer | null) {
  if (!signature) return null;
  if (typeof signature === "string") return signature;
  return signature.toString("base64");
}

function normalizeWalletAddress(value: unknown): string | null {
  if (typeof value === "string") {
    return StrKey.isValidEd25519PublicKey(value) ? value : null;
  }

  if (!value || typeof value !== "object") return null;

  for (const key of [
    "address",
    "publicKey",
    "public_key",
    "signerAddress",
    "accountId",
  ]) {
    if (key in value) {
      const normalized = normalizeWalletAddress(
        (value as Record<string, unknown>)[key],
      );
      if (normalized) return normalized;
    }
  }

  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/me", { cache: "no-store" });
    const payload = (await response.json()) as { walletAddress: string | null };

    setState((current) => ({
      ...current,
      sessionWalletAddress: payload.walletAddress,
    }));
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const connectAndSignIn = useCallback(async () => {
    setState((current) => ({ ...current, status: "checking", error: null }));

    try {
      const freighter = await import("@stellar/freighter-api");
      const connected = await freighter.isConnected();

      if (!connected.isConnected) {
        setState((current) => ({
          ...current,
          status: "unavailable",
          error: "Freighter extension is not available.",
        }));
        return;
      }

      const access = await freighter.requestAccess();
      const accessAddress = normalizeWalletAddress(access);

      if (access.error || !accessAddress) {
        setState((current) => ({
          ...current,
          status: "error",
          error: access.error
            ? normalizeError(access.error)
            : "Freighter did not return a valid Stellar public key.",
        }));
        return;
      }

      const networkDetails = await freighter.getNetworkDetails();
      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: accessAddress }),
      });
      const challenge = (await challengeResponse.json()) as { message: string };
      const signed = await freighter.signMessage(challenge.message, {
        address: accessAddress,
        networkPassphrase: networkDetails.networkPassphrase,
      });
      const signerAddress = normalizeWalletAddress(signed.signerAddress);

      if (signed.error || !signed.signedMessage || !signerAddress) {
        setState((current) => ({
          ...current,
          status: "error",
          error: signed.error
            ? normalizeError(signed.error)
            : "Freighter signature did not include a valid signer address.",
        }));
        return;
      }

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: accessAddress,
          signerAddress,
          signedMessage: normalizeSignedMessage(signed.signedMessage),
          message: challenge.message,
        }),
      });

      if (!verifyResponse.ok) {
        const payload = (await verifyResponse.json().catch(() => ({}))) as {
          error?: string;
        };
        setState((current) => ({
          ...current,
          status: "error",
          error: payload.error ?? "Signature verification failed.",
        }));
        return;
      }

      const verified = (await verifyResponse.json()) as { walletAddress: string };

      setState({
        status: "connected",
        walletAddress: accessAddress,
        sessionWalletAddress: verified.walletAddress,
        network: networkDetails.network,
        networkPassphrase: networkDetails.networkPassphrase,
        sorobanRpcUrl: networkDetails.sorobanRpcUrl ?? null,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error: normalizeError(error),
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState(initialState);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      ...state,
      connectAndSignIn,
      disconnect,
      refreshSession,
    }),
    [connectAndSignIn, disconnect, refreshSession, state],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
}
