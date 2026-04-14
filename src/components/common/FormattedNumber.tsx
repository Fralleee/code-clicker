import { formatNumber } from "../../utils/formatNumber";

interface Props {
  value: number;
  decimals?: number;
  className?: string;
}

export function FormattedNumber({ value, decimals, className }: Props) {
  return (
    <span className={`font-mono ${className ?? ""}`}>
      {formatNumber(value, decimals)}
    </span>
  );
}
