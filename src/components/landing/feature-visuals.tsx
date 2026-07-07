export function SplitRailVisual() {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-px w-[78%] -translate-x-1/2 bg-landing-cyan/42" />
      <div className="absolute left-[18%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-landing-cyan shadow-[0_0_24px_rgba(38,198,218,0.72)]" />
      <div className="absolute right-[18%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-landing-cyan shadow-[0_0_24px_rgba(38,198,218,0.72)]" />
      <div className="grid h-16 w-16 place-items-center rounded-[14px] border border-landing-cyan/42 bg-landing-bg text-landing-white shadow-[0_0_44px_rgba(38,198,218,0.18)]">
        <span className="relative block h-8 w-8">
          <span className="absolute left-1 top-1 h-4 w-4 rounded-[4px] border-[4px] border-current" />
          <span className="absolute right-1 top-1 h-4 w-4 rounded-[4px] border-[4px] border-current" />
          <span className="absolute bottom-1 left-1 h-4 w-4 rounded-[4px] border-[4px] border-current" />
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-[2px] bg-current" />
        </span>
      </div>
    </div>
  );
}

export function CheckoutOrbitVisual() {
  return (
    <div className="relative h-44 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-landing-cyan/38" />
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-landing-cyan/24" />
      <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-landing-cyan/42 bg-landing-cyan/12 text-landing-white">
        Q
      </div>
      {[
        ["left-[18%]", "top-[35%]"],
        ["right-[20%]", "top-[28%]"],
        ["left-[30%]", "bottom-[20%]"],
        ["right-[26%]", "bottom-[25%]"],
      ].map(([x, y], index) => (
        <div
          className={`absolute ${x} ${y} grid h-8 w-8 place-items-center rounded-full border border-landing-cyan/34 bg-landing-panel text-xs text-landing-cyan-soft`}
          key={`${x}-${y}`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
}

export function LedgerTableVisual() {
  const rows = [
    ["#9124", "Jane Doe", "25%", "Paid"],
    ["#9125", "Venue", "15%", "Paid"],
    ["#9126", "Community", "60%", "Synced"],
  ];

  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-[10px] border border-white/10 bg-black/20">
        <div className="grid grid-cols-[0.85fr_1.2fr_0.7fr_0.8fr] border-b border-white/8 px-3 py-2 font-mono text-[10px] uppercase text-landing-muted">
          <span>ID</span>
          <span>Recipient</span>
          <span>Split</span>
          <span>Status</span>
        </div>
        {rows.map((row) => (
          <div
            className="grid grid-cols-[0.85fr_1.2fr_0.7fr_0.8fr] items-center border-b border-white/7 px-3 py-3 text-xs text-landing-white last:border-b-0"
            key={row[0]}
          >
            <span className="font-mono text-landing-muted">{row[0]}</span>
            <span>{row[1]}</span>
            <span className="font-mono text-landing-cyan-soft">{row[2]}</span>
            <span className="rounded-full border border-landing-cyan/28 bg-landing-cyan/10 px-2 py-1 text-center font-mono text-[10px] text-landing-cyan-soft">
              {row[3]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PassVisual() {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden">
      <div className="absolute -right-12 top-5 h-34 w-26 rotate-[-18deg] rounded-[18px] border border-landing-cyan/18 bg-landing-cyan/8" />
      <div className="absolute -left-12 bottom-4 h-30 w-24 rotate-[16deg] rounded-[18px] border border-landing-cyan/16 bg-landing-cyan/6" />
      <div className="grid h-28 w-28 place-items-center rounded-[18px] border border-white/14 bg-landing-panel-strong shadow-[0_0_50px_rgba(38,198,218,0.18)]">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              className={
                [0, 1, 3, 5, 6, 8, 11, 13, 15, 17, 18, 20, 23, 24].includes(
                  index,
                )
                  ? "h-2 w-2 rounded-[2px] bg-landing-cyan-soft"
                  : "h-2 w-2 rounded-[2px] bg-white/12"
              }
              key={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
