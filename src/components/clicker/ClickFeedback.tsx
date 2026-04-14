import { useCallback, useState } from "react";
import { formatNumber } from "../../utils/formatNumber";

interface FloatingText {
  id: number;
  value: number;
  x: number;
  y: number;
}

let nextId = 0;

export function useClickFeedback() {
  const [floats, setFloats] = useState<FloatingText[]>([]);

  const addFloat = useCallback((value: number, x: number, y: number) => {
    const id = nextId++;
    const offsetX = (Math.random() - 0.5) * 60;
    setFloats((prev) => [...prev, { id, value, x: x + offsetX, y }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 800);
  }, []);

  return { floats, addFloat };
}

interface Props {
  floats: FloatingText[];
}

export function ClickFeedbackLayer({ floats }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {floats.map((f) => (
        <div
          key={f.id}
          className="absolute font-mono font-bold text-accent-green text-lg"
          style={{
            left: f.x,
            top: f.y,
            animation: "float-up 0.8s ease-out forwards",
          }}
        >
          +{formatNumber(f.value)}
        </div>
      ))}
    </div>
  );
}
