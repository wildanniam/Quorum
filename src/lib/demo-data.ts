import {
  BadgeCheck,
  BanknoteArrowUp,
  CalendarDays,
  CircleDollarSign,
  FileKey2,
  Handshake,
  MapPin,
  QrCode,
  ShieldCheck,
  TicketCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

export const demoEvent = {
  id: "evt_apac_stellar_builder_meetup",
  slug: "apac-stellar-builder-meetup",
  title: "APAC Stellar Builder Meetup",
  type: "Paid Web3 Meetup + Mini Workshop",
  date: "Jun 21, 2026",
  time: "18:30 GMT+7",
  location: "Jakarta + livestream",
  price: "5 USDC",
  capacity: 80,
  sold: 37,
  checkedIn: 18,
  organizerWallet: "GDQO...7N2K",
  tokenContract: "QuorumPassNFT",
  split: [
    { role: "Organizer", name: "Jakarta Stellar Guild", percent: 70 },
    { role: "Speaker", name: "Soroban Mentor", percent: 20 },
    { role: "Community Partner", name: "SEA Builders", percent: 10 },
  ],
  resources: [
    { type: "Deck", title: "Workshop Deck" },
    { type: "Repo", title: "Soroban Starter Repo" },
    { type: "Notes", title: "Private Builder Notes" },
  ],
};

export const marketplaceStats = [
  { label: "Published events", value: "12", tone: "accent" },
  { label: "Collaborator wallets", value: "43", tone: "cyan" },
  { label: "Passes minted", value: "328", tone: "amber" },
  { label: "USDC routed", value: "1,640", tone: "coral" },
];

export const proofRail = [
  {
    icon: CircleDollarSign,
    label: "Checkout",
    value: "USDC testnet",
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
    value: "On-chain check-in",
  },
];

export const navItems = [
  { href: "/", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events/new", label: "Create" },
  { href: "/passes", label: "Passes" },
];

export const dashboardCards = [
  {
    icon: CalendarDays,
    label: "Organizer event",
    value: demoEvent.title,
    detail: "Draft to published workflow is next.",
  },
  {
    icon: UsersRound,
    label: "Capacity",
    value: `${demoEvent.sold}/${demoEvent.capacity}`,
    detail: `${demoEvent.checkedIn} checked in on-chain.`,
  },
  {
    icon: BanknoteArrowUp,
    label: "Withdrawable",
    value: "259 USDC",
    detail: "Collaborator balances will come from QuorumCore.",
  },
  {
    icon: BadgeCheck,
    label: "Access proof",
    value: "37 passes",
    detail: "One unique NFT per attendee wallet.",
  },
];

export const eventFacts = [
  { icon: CalendarDays, label: `${demoEvent.date} · ${demoEvent.time}` },
  { icon: MapPin, label: demoEvent.location },
  { icon: WalletCards, label: "Freighter demo wallet" },
  { icon: ShieldCheck, label: "Escrow + NFT proof" },
  { icon: TicketCheck, label: "Single pass per wallet" },
];
