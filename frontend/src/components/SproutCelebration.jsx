import { motion } from "framer-motion";

// Bu illüstrasyona özel renkler — genel marka paletinden (index.css @theme)
// bilerek ayrı tutuldu, sadece bu component içinde kullanılıyor.
const SPROUT_COLORS = {
  stem: "#2E6E5B",
  leafLight: "#A3D9A1",
  leafDark: "#4F8C5A",
  caption: "#1A3E2E",
  soilBrown: "#4B3C2B",
  soilLight: "#A85D3A",
  soilHighlight: "#D69D6E",
  glow: "#FFF0C3",
};

export default function SproutCelebration() {
  return (
    <div className="flex flex-col items-center gap-1 pt-1">
      <svg width="92" height="120" viewBox="0 0 100 130" fill="none">
        <motion.circle
          cx="50"
          cy="45"
          r="38"
          fill={SPROUT_COLORS.glow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 0.1 }}
        />

        <motion.ellipse
          cx="50"
          cy="112"
          rx="30"
          ry="10"
          fill={SPROUT_COLORS.soilBrown}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: "50px 112px" }}
        />
        <ellipse cx="46" cy="108" rx="14" ry="4" fill={SPROUT_COLORS.soilLight} opacity="0.6" />
        <ellipse cx="42" cy="106" rx="6" ry="2" fill={SPROUT_COLORS.soilHighlight} opacity="0.5" />

        <motion.path
          d="M50,110 C47,90 53,70 50,42"
          fill="none"
          stroke={SPROUT_COLORS.stem}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
        />

        <motion.path
          d="M50,55 C35,50 28,58 30,68 C42,68 50,62 50,55 Z"
          fill={SPROUT_COLORS.leafDark}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.0, type: "spring", stiffness: 260, damping: 14 }}
          style={{ transformOrigin: "50px 60px" }}
        />
        <motion.path
          d="M50,48 C65,43 72,51 70,61 C58,61 50,55 50,48 Z"
          fill={SPROUT_COLORS.leafLight}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.15, type: "spring", stiffness: 260, damping: 14 }}
          style={{ transformOrigin: "50px 53px" }}
        />
      </svg>
    </div>
  );
}
