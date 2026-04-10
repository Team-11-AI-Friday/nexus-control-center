import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: "primary" | "secondary" | "success" | "warning" | "destructive";
}

const glowColors = {
  primary: "hover:shadow-[0_0_30px_hsla(190,100%,50%,0.15)]",
  secondary: "hover:shadow-[0_0_30px_hsla(263,70%,50%,0.15)]",
  success: "hover:shadow-[0_0_30px_hsla(160,60%,45%,0.15)]",
  warning: "hover:shadow-[0_0_30px_hsla(38,92%,50%,0.15)]",
  destructive: "hover:shadow-[0_0_30px_hsla(0,84%,60%,0.15)]",
};

export function GlassCard({ children, className, hover = false, onClick, glow = "primary" }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        "glass-card p-6",
        hover && "cursor-pointer transition-all duration-300",
        hover && glowColors[glow],
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
