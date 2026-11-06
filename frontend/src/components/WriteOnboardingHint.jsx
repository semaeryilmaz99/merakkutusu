import { useTranslation } from "react-i18next";
import { useOnboarding } from "../context/OnboardingContext";

// Navbar/BottomBar'daki OnboardingHint'in Editorial (WriteArticle.jsx +
// WriteNavHeader.jsx'e özel krem/lacivert tasarım dili) karşılığı — aynı
// brand-900/accent-gold baloncuğu buraya taşımak, bu sayfanın sıcak/yuvarlak
// estetiğiyle çakışırdı.
const PLACEMENT_CLASSES = {
  bottom: "top-full mt-3",
  top: "bottom-full mb-3",
};

const ARROW_CLASSES = {
  bottom: "-top-1 border-l border-t",
  top: "-bottom-1 border-r border-b",
};

export default function WriteOnboardingHint({ stepId, placement = "bottom", children }) {
  const { t } = useTranslation("onboarding");
  const { writeStepId, writeStep, writeStepNumber, writeTotalSteps, writeNext, writeSkip } = useOnboarding();
  const isActive = writeStepId === stepId;

  return (
    <div className="relative">
      {/* flex (inline-flex DEĞİL): write-editor adımı MDEditor'ı sarıyor ve onun
          iç elemanları %100 genişliğe dayanıyor — inline-flex sarmalayıcı
          shrink-to-fit ile boyutlanıp bu yüzdeleri "auto" sayardı, editör
          neredeyse sıfır genişliğe çökerdi (metin harf harf alt alta dizilirdi).
          flex, blok seviyesinde kalıp kapsayıcısının tam genişliğini doldurur. */}
      <div className={`flex ${isActive ? "rounded-full ring-2 ring-ed-navy" : ""}`}>{children}</div>

      {isActive && (
        <div
          className={`absolute left-1/2 z-[60] w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-[var(--radius-ed-lg)] border border-ed-border bg-ed-surface p-4 text-left shadow-[var(--shadow-ed-soft)] font-ed-sans ${PLACEMENT_CLASSES[placement]}`}
        >
          <div
            className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-ed-border bg-ed-surface ${ARROW_CLASSES[placement]}`}
          />

          <span className="ed-kicker">{t(writeStep.titleKey)}</span>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-ed-muted">{t(writeStep.textKey)}</p>

          <div className="mt-3 flex items-center justify-between">
            <button type="button" onClick={writeSkip} className="text-xs text-ed-placeholder hover:text-ed-ink-soft">
              {t("skip")}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ed-placeholder">
                {writeStepNumber}/{writeTotalSteps}
              </span>
              <button type="button" onClick={writeNext} className="ed-btn ed-btn-primary h-7 px-3 text-xs">
                {writeStepNumber === writeTotalSteps ? t("finish") : t("next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
