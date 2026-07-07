import Image from "next/image";

const qrCells = new Set([0, 1, 3, 5, 6, 8, 11, 13, 15, 17, 18, 20, 23, 24]);

function FeatureGridBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 opacity-85"
      style={{
        backgroundImage:
          "linear-gradient(rgba(39,38,38,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(39,38,38,0.24) 1px, transparent 1px)",
        backgroundSize: "58.8px 58.8px",
      }}
    />
  );
}

export function SplitRailVisual() {
  return (
    <>
      <Image
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        height={271}
        priority={false}
        sizes="(min-width: 1024px) 588px, calc(100vw - 32px)"
        src="/figma/landing/feature-split-rail.svg"
        width={588}
      />
    </>
  );
}

export function CheckoutOrbitVisual() {
  return (
    <>
      <FeatureGridBackdrop />
      <div
        aria-hidden="true"
        className="absolute -left-14 -top-12 h-48 w-48 rounded-full bg-landing-cyan/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-14 bottom-[-5.5rem] h-52 w-52 rounded-full bg-landing-cyan/5 blur-3xl"
      />
      <Image
        alt=""
        className="absolute left-1/2 top-[-6.6rem] h-auto w-[416px] max-w-none -translate-x-1/2 select-none transition-transform duration-500 ease-out group-hover:scale-[1.025]"
        height={378}
        sizes="416px"
        src="/figma/landing/feature-checkout-orbit.svg"
        width={416}
      />
    </>
  );
}

export function LedgerTableVisual() {
  const rows = [
    {
      amount: "50 USDC",
      event: "Stellar Hackathon 2026",
      id: "#STX-890123",
      recipients: "2 Recipients",
      role: "Organizer",
      status: "Success",
      time: "18 July 2026, 10:21 AM",
    },
    {
      amount: "150 USDC",
      event: "Cosmic Code Jam",
      id: "#STX-890124",
      recipients: "5 Recipients",
      role: "Sponsor",
      status: "Success",
      time: "22 August 2026, 3:45 PM",
    },
    {
      amount: "75 USDC",
      event: "Lunar Dev Summit",
      id: "#STX-890125",
      recipients: "1 Recipient",
      role: "Participant",
      status: "Success",
      time: "05 September 2026, 9:00 AM",
    },
  ];

  return (
    <>
      <FeatureGridBackdrop />
      <div className="absolute left-0 top-0 h-[11.5rem] w-[588px] origin-top-left scale-[0.62] overflow-hidden sm:inset-x-0 sm:w-full sm:scale-100">
        <div className="grid grid-cols-[1fr_1.32fr_1.28fr_0.74fr_0.78fr_0.66fr] border-b border-white/[0.055] px-2.5 py-2.5 font-product text-[9px] leading-none text-white/90 sm:text-[10px]">
          <span>ID</span>
          <span>Event</span>
          <span>Date &amp; Time</span>
          <span>Ammount</span>
          <span>Recipients</span>
          <span>Status</span>
        </div>
        {rows.map((row, index) => (
          <div
            className="grid min-h-[49px] grid-cols-[1fr_1.32fr_1.28fr_0.74fr_0.78fr_0.66fr] items-center border-b border-white/[0.045] px-2.5 text-[9px] leading-tight text-white/92 sm:text-[10px]"
            key={row.id}
          >
            <span className={index === 2 ? "text-white/38" : ""}>{row.id}</span>
            <span className={index === 2 ? "text-white/42" : ""}>
              <span className="block truncate">{row.event}</span>
              <span className="block text-[8px] text-white/45">{row.role}</span>
            </span>
            <span className={index === 2 ? "text-white/42" : ""}>
              <span className="block truncate">{row.time}</span>
              <span className="block text-[8px] text-white/45">
                {index === 0 ? "2 sec ago" : index === 1 ? "1 min ago" : "Just now"}
              </span>
            </span>
            <span className={index === 2 ? "text-white/42" : ""}>{row.amount}</span>
            <span className="flex flex-col gap-1">
              <span className="flex -space-x-1">
                <span className="h-[18px] w-[18px] rounded-full bg-[url('/figma/landing/john-avatar.webp')] bg-cover ring-1 ring-[#0b0a0a]" />
                {index !== 2 ? (
                  <span className="h-[18px] w-[18px] rounded-full bg-[url('/figma/landing/sarah-avatar.webp')] bg-cover ring-1 ring-[#0b0a0a]" />
                ) : null}
                {index === 1 ? (
                  <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-white/12 text-[7px] text-white ring-1 ring-[#0b0a0a]">
                    3+
                  </span>
                ) : null}
              </span>
              <span className="text-[8px] text-white/45">{row.recipients}</span>
            </span>
            <span className="rounded-full border border-landing-cyan/35 bg-landing-cyan/10 px-2 py-1 text-center text-[9px] text-landing-cyan-soft">
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[7.8rem] h-28 bg-gradient-to-b from-transparent via-[#0b0a0a]/76 to-[#0b0a0a]"
      />
    </>
  );
}

export function PassVisual() {
  return (
    <>
      <FeatureGridBackdrop />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[3.35rem] h-24 bg-landing-cyan/8 blur-2xl"
      />
      <Image
        alt=""
        className="absolute -left-11 -top-5 h-auto w-[250px] max-w-none select-none opacity-95 transition-transform duration-500 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1"
        height={162}
        sizes="250px"
        src="/figma/landing/feature-pass-left.svg"
        width={341}
      />
      <Image
        alt=""
        className="absolute -right-14 -top-1 h-auto w-[245px] max-w-none select-none opacity-95 transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:-translate-y-1"
        height={143}
        sizes="245px"
        src="/figma/landing/feature-pass-right.svg"
        width={208}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[3.65rem] grid h-[5.8rem] w-[8.9rem] -translate-x-1/2 rotate-[3deg] place-items-center rounded-[14px] border border-landing-cyan/24 bg-[#0c0b0b]/92 shadow-[0_0_38px_rgba(38,198,218,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              className={
                qrCells.has(index)
                  ? "h-2 w-2 rounded-[2px] bg-white/75"
                  : "h-2 w-2 rounded-[2px] bg-white/14"
              }
              key={index}
            />
          ))}
        </div>
      </div>
    </>
  );
}
