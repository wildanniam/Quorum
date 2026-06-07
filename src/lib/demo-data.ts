import {
  CircleDollarSign,
  FileKey2,
  Handshake,
  QrCode,
} from "lucide-react";

export const proofRail = [
  {
    icon: CircleDollarSign,
    label: "Checkout",
    value: "USDC-ready",
  },
  {
    icon: Handshake,
    label: "Split",
    value: "70 / 20 / 10",
  },
  {
    icon: FileKey2,
    label: "Pass",
    value: "Non-transferable NFT",
  },
  {
    icon: QrCode,
    label: "Verify",
    value: "Check-in proof",
  },
];

export const navItems = [
  { href: "/", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events/new", label: "Create" },
  { href: "/passes", label: "Passes" },
];
