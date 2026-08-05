export function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(hsl(240 6% 18% / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(240 6% 18% / 0.35) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      <div className="mesh-blob left-[-12%] top-[-10%] h-[38rem] w-[38rem] bg-sky-500/20" />
      <div className="mesh-blob right-[-12%] top-[15%] h-[32rem] w-[32rem] bg-violet-600/20" />
      <div className="mesh-blob bottom-[-20%] left-[25%] h-[36rem] w-[36rem] bg-fuchsia-600/10" />
    </div>
  );
}
