import { useTranslation } from "react-i18next";
import { useOnboarding } from "../context/OnboardingContext";

// Navbar'da baloncuk altta açılır (nav üstte), BottomBar'da üstte açılır
// (footer altta, aksi halde ekran dışına taşar).
const PLACEMENT_CLASSES = {
  bottom: "top-full mt-3",
  top: "bottom-full mb-3",
};

const ARROW_CLASSES = {
  bottom: "-top-1 border-l border-t",
  top: "-bottom-1 border-r border-b",
};

// align="center" baloncuğu hedefin tam ortasına hizalar — ama Navbar'daki
// profil avatarı gibi ekranın sağ kenarına yapışık öğelerde bu, baloncuğu
// viewport'un dışına taşırıp yatay scrollbar'a yol açar; align="right" bu
// durumda baloncuğun sağ kenarını hedefin sağ kenarına sabitler.
const BUBBLE_ALIGN_CLASSES = {
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};
const ARROW_ALIGN_CLASSES = {
  center: "left-1/2 -translate-x-1/2",
  right: "right-4",
};

// Navbar/BottomBar'daki mevcut bir elemanı değiştirmeden sarıp, o adım
// aktifken yanına/üstüne bir konuşma baloncuğu ekler. `bubbleBreakpoint`,
// Navbar ve BottomBar'daki aynı hedefin aynı anda ikisinin de baloncuk
// göstermesini (640-1023px aralığında) önlemek için baloncuğun kendisine
// ek bir görünürlük sınırı verir — anchor elemanın kendi breakpoint'inden
// bağımsız olarak.
export default function OnboardingHint({ stepId, placement = "bottom", align = "center", bubbleBreakpoint = "", children }) {
  const { t } = useTranslation("onboarding");
  const { activeStepId, step, stepNumber, totalSteps, next, skip } = useOnboarding();
  const isActive = activeStepId === stepId;

  return (
    <div className="relative">
      {/* flex (inline-flex DEĞİL): çocuk (ör. Keşfet NavLink'i) varsayılan olarak
          inline bir <a> olabilir — düz bir block div onu sararsa, inline
          elemanların satır altı boşluğu yüzünden halka oval/kaymış görünür;
          flex bu boşluğu da ortadan kaldırır. inline-flex DEĞİL flex seçildi,
          çünkü shrink-to-fit (inline-flex) içindeki %100 genişlikli bir
          torun (WriteOnboardingHint'teki editör gibi) neredeyse sıfıra
          çökebiliyor — flex, Navbar'ın kendi flex satırında zaten içeriğe göre
          daralıyor, aynı sorunu yaşamadan güvenli. */}
      <div className={`flex ${isActive ? "rounded-full ring-2 ring-accent-gold" : ""}`}>{children}</div>

      {isActive && (
        <div
          className={`absolute z-[60] w-56 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-4 text-left shadow-lg ${PLACEMENT_CLASSES[placement]} ${BUBBLE_ALIGN_CLASSES[align]} ${bubbleBreakpoint}`}
        >
          <div className={`absolute h-3 w-3 rotate-45 border-gray-200 bg-white ${ARROW_CLASSES[placement]} ${ARROW_ALIGN_CLASSES[align]}`} />

          <p className="text-xs font-semibold text-brand-900">{t(step.titleKey)}</p>
          <p className="mt-1 text-xs text-gray-600">{t(step.textKey)}</p>

          <div className="mt-3 flex items-center justify-between">
            <button type="button" onClick={skip} className="text-xs text-gray-400 hover:text-gray-600">
              {t("skip")}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {stepNumber}/{totalSteps}
              </span>
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-brand-700 px-3 py-1 text-xs font-medium text-white hover:bg-brand-800"
              >
                {stepNumber === totalSteps ? t("finish") : t("next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
