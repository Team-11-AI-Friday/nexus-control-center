import { cn } from "@/lib/utils";

interface RiskScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function RiskScoreGauge({ score, size = "md" }: RiskScoreGaugeProps) {
  const sizes = { sm: 60, md: 100, lg: 140 };
  const s = sizes[size];
  const strokeWidth = size === "sm" ? 6 : 8;
  const radius = (s - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score <= 30) return "hsl(160, 60%, 45%)";
    if (score <= 60) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={s} height={s / 2 + 10} viewBox={`0 0 ${s} ${s / 2 + 10}`}>
        <path
          d={`M ${strokeWidth / 2} ${s / 2} A ${radius} ${radius} 0 0 1 ${s - strokeWidth / 2} ${s / 2}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${s / 2} A ${radius} ${radius} 0 0 1 ${s - strokeWidth / 2} ${s / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out", filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text
          x={s / 2}
          y={s / 2 - 5}
          textAnchor="middle"
          className="font-mono font-bold fill-foreground"
          fontSize={size === "sm" ? 14 : size === "md" ? 20 : 28}
        >
          {score}
        </text>
        <text
          x={s / 2}
          y={s / 2 + (size === "sm" ? 8 : 12)}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={size === "sm" ? 8 : 10}
        >
          Risk Score
        </text>
      </svg>
    </div>
  );
}
