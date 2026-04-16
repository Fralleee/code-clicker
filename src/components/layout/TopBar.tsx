import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import {
  selectCanPrestige,
  selectClickValue,
  selectLocPerSecond,
  selectNetTechDebtPerSecond,
  selectReputationOnPrestige,
  selectTechDebtMultiplier,
} from "../../store/selectors";
import { formatNumber, formatRate } from "../../utils/formatNumber";

interface Props {
  onPrestigeClick: () => void;
  onHelpClick: () => void;
}

export function TopBar({ onPrestigeClick, onHelpClick }: Props) {
  const resetGame = useGameStore((s) => s.resetGame);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const loc = useGameStore((s) => s.resources.linesOfCode);
  const td = useGameStore((s) => s.resources.techDebt);
  const refactorDebt = useGameStore((s) => s.refactorDebt);
  const refactoringUntil = useGameStore((s) => s.refactoringUntil);
  const state = useGameStore.getState();
  const locPerSec = selectLocPerSecond(state);
  const clickValue = selectClickValue(state);
  const canPrestige = selectCanPrestige(state);
  const repOnPrestige = selectReputationOnPrestige(state);
  const reputation = useGameStore((s) => s.prestige.totalReputationEarned);
  const netTdPerSec = selectNetTechDebtPerSecond(state);
  const debtMult = selectTechDebtMultiplier(state);

  const hasTD = td > 0;
  const penaltyPercent = Math.round((1 - debtMult) * 100);
  const isRefactoring = (refactoringUntil ?? 0) > Date.now();
  const refactorRemaining = isRefactoring ? Math.ceil(((refactoringUntil ?? 0) - Date.now()) / 1000) : 0;

  return (
    <header className="flex items-center justify-between px-6 py-2.5 bg-bg-editor-bar border-b border-white/5 shrink-0">
      {/* Left: resource stats */}
      <div className="flex items-center gap-5">
        {/* Main LoC counter */}
        <div className="flex items-center gap-3 pr-5 border-r border-white/10">
          <div>
            <div className="font-mono text-2xl font-bold text-text-primary tracking-tight">{formatNumber(loc)}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Lines of Code</div>
          </div>
        </div>

        {/* Production stats */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted uppercase w-12">Per sec</span>
            {isRefactoring ? (
              <span className="font-mono text-sm text-accent-gold font-semibold animate-pulse">
                Refactoring... {refactorRemaining}s
              </span>
            ) : (
              <span className="font-mono text-sm text-accent-cyan font-semibold">{formatRate(locPerSec)}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted uppercase w-12">Per click</span>
            <span className="font-mono text-sm text-text-primary">{formatNumber(clickValue)}</span>
          </div>
        </div>

        {/* Reputation (only when > 0) */}
        {reputation > 0 && (
          <div className="flex flex-col gap-0.5 pl-5 border-l border-white/10">
            <span className="font-mono text-sm text-accent-gold font-semibold">{formatNumber(reputation)}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Reputation</span>
          </div>
        )}

        {/* Tech Debt indicator - always show once any TD exists or net rate is nonzero */}
        {(hasTD || netTdPerSec !== 0) && (
          <div className="flex flex-col gap-0.5 pl-5 border-l border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm text-accent-pink font-semibold">{formatNumber(td)}</span>
              <span
                className={`text-[10px] font-mono ${netTdPerSec <= 0 ? "text-accent-green" : "text-accent-pink/60"}`}
              >
                {netTdPerSec <= 0 ? "" : "+"}
                {formatNumber(netTdPerSec)}/s
              </span>
            </div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              Tech Debt
              {penaltyPercent > 0 && (
                <span className="text-accent-pink ml-1 normal-case">(-{penaltyPercent}% LoC)</span>
              )}
            </span>
            {isRefactoring ? (
              <span className="mt-1 text-[10px] text-accent-gold font-semibold animate-pulse">
                Refactoring... {refactorRemaining}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => refactorDebt()}
                disabled={td <= 0}
                className="mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={`Pauses 10s, removes ${formatNumber(td * 0.7)} TD`}
              >
                Refactor (-70% TD)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {confirmingRestart ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-accent-pink font-semibold">Are you sure?</span>
            <button
              type="button"
              onClick={() => {
                resetGame();
                setConfirmingRestart(false);
              }}
              className="px-2 py-1 rounded text-xs font-semibold bg-accent-pink/20 text-accent-pink border border-accent-pink/40 hover:bg-accent-pink/30 cursor-pointer transition-colors"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRestart(false)}
              className="px-2 py-1 rounded text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingRestart(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-accent-pink/60 hover:text-accent-pink hover:bg-accent-pink/10 cursor-pointer transition-colors"
          >
            Restart
          </button>
        )}
        <button
          type="button"
          onClick={onHelpClick}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer transition-colors"
        >
          Help
        </button>

        <button
          type="button"
          onClick={onPrestigeClick}
          disabled={!canPrestige}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            canPrestige
              ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/30 cursor-pointer animate-[pulse-gold_2s_ease-in-out_infinite]"
              : "bg-white/5 text-text-muted border border-white/5 cursor-not-allowed"
          }`}
        >
          Ship Product
          {canPrestige && repOnPrestige > 0 && (
            <span className="ml-1 text-xs opacity-75">+{formatNumber(repOnPrestige)} rep</span>
          )}
        </button>
      </div>
    </header>
  );
}
