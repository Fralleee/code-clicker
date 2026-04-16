import { useState } from "react";
import { Drawer } from "vaul";
import { useGameStore } from "../../store/gameStore";
import { HackPanel } from "../shop/HackPanel";
import { ShopPanel } from "../shop/ShopPanel";
import { StatsPanel } from "./StatsPanel";

type MobileTab = "shop" | "hacks" | "stats";

interface Props {
  onHelpClick: () => void;
}

export function MobileBottomNav({ onHelpClick }: Props) {
  const [activeDrawer, setActiveDrawer] = useState<MobileTab | null>(null);
  const resetGame = useGameStore((s) => s.resetGame);
  const [confirmingRestart, setConfirmingRestart] = useState(false);

  const openDrawer = (tab: MobileTab) => setActiveDrawer(tab);
  const closeDrawer = () => {
    setActiveDrawer(null);
    setConfirmingRestart(false);
  };

  return (
    <>
      {/* Fixed bottom navigation bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden flex items-center justify-around bg-bg-editor-bar border-t border-white/5 px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <NavButton icon="🏪" label="Shop" active={activeDrawer === "shop"} onClick={() => openDrawer("shop")} />
        <NavButton icon="🍝" label="Hacks" active={activeDrawer === "hacks"} onClick={() => openDrawer("hacks")} />
        <NavButton icon="📊" label="Stats" active={activeDrawer === "stats"} onClick={() => openDrawer("stats")} />
        <NavButton
          icon="❓"
          label="Help"
          active={false}
          onClick={() => {
            closeDrawer();
            onHelpClick();
          }}
        />
      </nav>

      {/* Shop Drawer */}
      <MobileDrawer title="Shop" open={activeDrawer === "shop"} onClose={closeDrawer}>
        <ShopPanel />
      </MobileDrawer>

      {/* Hacks Drawer */}
      <MobileDrawer title="Hacks" open={activeDrawer === "hacks"} onClose={closeDrawer}>
        <div className="p-3">
          <HackPanel />
        </div>
      </MobileDrawer>

      {/* Stats Drawer */}
      <MobileDrawer title="Stats" open={activeDrawer === "stats"} onClose={closeDrawer}>
        <StatsPanel hideHacks />
        <div className="p-3 border-t border-white/5">
          {confirmingRestart ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-accent-pink font-semibold">Erase all progress?</span>
              <button
                type="button"
                onClick={() => {
                  resetGame();
                  setConfirmingRestart(false);
                  closeDrawer();
                }}
                className="px-2 py-1 rounded text-xs font-semibold bg-accent-pink/20 text-accent-pink border border-accent-pink/40 cursor-pointer"
              >
                Yes, restart
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRestart(false)}
                className="px-2 py-1 rounded text-xs font-semibold text-text-muted cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingRestart(true)}
              className="w-full py-2 rounded-lg text-xs font-semibold text-accent-pink/60 hover:text-accent-pink hover:bg-accent-pink/10 cursor-pointer transition-colors"
            >
              Restart Game
            </button>
          )}
        </div>
      </MobileDrawer>
    </>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
        active ? "text-accent-cyan bg-accent-cyan/10" : "text-text-muted"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MobileDrawer({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root direction="bottom" open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40 lg:hidden" />
        <Drawer.Content className="fixed bottom-0 inset-x-0 z-40 h-[70dvh] rounded-t-2xl bg-bg-surface border-t border-white/10 outline-none flex flex-col lg:hidden">
          <div className="flex items-center justify-center pt-2 pb-1">
            <div className="w-8 h-1 rounded-full bg-white/20" />
          </div>
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
