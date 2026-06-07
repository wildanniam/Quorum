"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  return "Wallet request failed.";
}

function normalizeSignedMessage(signature: string | Buffer | null) {
  if (!signature) return null;
  if (typeof signature === "string") return signature;
  return signature.toString("base64");
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

      if (access.error || !access.address) {
        setState((current) => ({
          ...current,
          status: "error",
          error: access.error ? String(access.error) : "Wallet access rejected.",
        }));
        return;
      }

      const networkDetails = await freighter.getNetworkDetails();
      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: access.address }),
      });
      const challenge = (await challengeResponse.json()) as { message: string };
      const signed = await freighter.signMessage(challenge.message, {
        address: access.address,
        networkPassphrase: networkDetails.networkPassphrase,
      });

      if (signed.error || !signed.signedMessage) {
        setState((current) => ({
          ...current,
          status: "error",
          error: signed.error ? String(signed.error) : "Signature rejected.",
        }));
        return;
      }

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: access.address,
          signerAddress: signed.signerAddress,
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
        walletAddress: access.address,
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
