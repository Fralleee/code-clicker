import { useCallback, useRef, useState } from "react";
import { getRandomSnippet } from "../../data/codeSnippets";
import { useGameStore } from "../../store/gameStore";
import { ClickFeedbackLayer, useClickFeedback } from "./ClickFeedback";

interface CodeLine {
  id: number;
  text: string;
}

let lineIdCounter = 2;

export function CodeEditor() {
  const click = useGameStore((s) => s.click);
  const [lines, setLines] = useState<CodeLine[]>([
    { id: 0, text: "// Welcome to CodeClicker!" },
    { id: 1, text: "// Click here to write code..." },
  ]);
  const [isBouncing, setIsBouncing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const linesEndRef = useRef<HTMLDivElement>(null);
  const { floats, addFloat } = useClickFeedback();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const value = click();
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect) {
        addFloat(value, e.clientX - rect.left, e.clientY - rect.top);
      }

      setLines((prev) => {
        const newLine = { id: lineIdCounter++, text: getRandomSnippet() };
        const next = [...prev, newLine];
        if (next.length > 50) return next.slice(-50);
        return next;
      });

      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 150);

      requestAnimationFrame(() => {
        linesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    },
    [click, addFloat],
  );

  return (
    <div
      ref={editorRef}
      className={`relative rounded-xl overflow-hidden border border-white/10 transition-transform select-none cursor-pointer h-full flex flex-col ${
        isBouncing ? "scale-[1.02]" : "scale-100"
      }`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          handleClick(e as unknown as React.MouseEvent);
      }}
      role="button"
      tabIndex={0}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-bg-editor-bar">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-text-muted ml-2 font-mono">
          main.ts - CodeClicker IDE
        </span>
      </div>

      {/* Code area */}
      <div className="flex-1 bg-bg-editor overflow-y-auto p-4 font-mono text-sm leading-relaxed min-h-0">
        {lines.map((line, i) => (
          <div key={line.id} className="flex">
            <span className="w-8 text-right text-text-muted/40 mr-4 shrink-0 select-none">
              {i + 1}
            </span>
            <span className="text-text-secondary">{line.text}</span>
          </div>
        ))}
        <div ref={linesEndRef} />
      </div>

      <ClickFeedbackLayer floats={floats} />
    </div>
  );
}
