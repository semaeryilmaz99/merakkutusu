import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const OnboardingContext = createContext(null);

// Sıra, kullanıcının önce içerik keşfetmesi, sonra yazmayı denemesi, sonra
// profilini öğrenmesi mantığına göre seçildi. Bildirimler çıkarıldı — zil
// ikonu kendini açıklıyor, ayrıca bir baloncuğa gerek yok.
const NAV_STEPS = [
  {
    id: "explore",
    title: "Keşfet",
    text: "Topluluktaki en yeni ve popüler makaleleri burada bulabilirsin.",
  },
  {
    id: "write",
    title: "Makale Yaz",
    text: "Bildiklerini paylaş — yazarken AI sana akademik kaynak önerilerinde bulunur.",
  },
  {
    id: "profile",
    title: "Profilin",
    text: "Biyografini düzenle, ilgi alanlarını güncelle ve paylaşımlarını buradan gör.",
  },
];

// WriteArticle.jsx'teki bütün anahtar özellikleri sırayla tanıtan, sayfaya
// ilk gelindiğinde tetiklenen ayrı bir tur (nav turuyla aynı mekanizma,
// farklı bir localStorage bayrağıyla, WriteArticle.jsx'in kendi mount'unda
// başlatılıyor — Layout'un mount'unda değil).
const WRITE_STEPS = [
  {
    id: "write-tags",
    title: "Etiketler",
    text: "Makaleni ilgili etiketlerle işaretle, doğru okuyuculara ulaşsın.",
  },
  {
    id: "write-editor",
    title: "Komut paleti",
    text: "Yazarken '/' tuşuna bas: başlık, liste, alıntı, kaynak önerisi ve daha fazlasına tek tuşla ulaş.",
  },
  {
    id: "write-sources",
    title: "Kaynak öner",
    text: "AI, taslağına göre akademik kaynak önerir — tek tıkla atıf ekleyebilirsin.",
  },
  {
    id: "write-notes",
    title: "Notlarımdan ekle",
    text: "Not sayfanda yüklediğin PDF özetlerinden birini tek tıkla taslağına taşı.",
  },
  {
    id: "write-cover",
    title: "Kapak görseli",
    text: "İstersen bir kapak görseli ekle — opsiyonel, boş da yayınlayabilirsin.",
  },
  {
    id: "write-publish",
    title: "Yayınla",
    text: "Hazır olduğunda makaleni buradan yayınla.",
  },
];

const flagKey = (name, userId) => `onboardingSeen_${name}_${userId}`;

// Hem ana kabuk turu hem de yazma sayfası turu için paylaşılan, sıralı adım
// mantığı — sadece hangi bayrakla kalıcılaştığı ve ne zaman başladığı farklı.
function useStepFlow(steps, name, user) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const hasSeen = () => !user || localStorage.getItem(flagKey(name, user._id)) === "true";

  const complete = () => {
    if (user) localStorage.setItem(flagKey(name, user._id), "true");
    setActiveIndex(-1);
  };

  const start = () => {
    if (hasSeen()) return;
    setActiveIndex(0);
  };

  const next = () => {
    setActiveIndex((i) => {
      if (i >= steps.length - 1) {
        complete();
        return -1;
      }
      return i + 1;
    });
  };

  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;

  return {
    activeStepId: activeStep?.id ?? null,
    step: activeStep,
    stepNumber: activeIndex + 1,
    totalSteps: steps.length,
    next,
    skip: complete,
    start,
  };
}

// "Bu chat odasına girmek için makaleyi kütüphanene eklemelisin" kuralını
// ChatPanel.jsx'te proaktif olarak hatırlatan, tek seferlik, sıralı olmayan
// bir ipucu — backend zaten bunu hata olarak dönüyor ama kullanıcı o hataya
// çarpmadan önce bilsin diye.
function useDismissFlag(name, user) {
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    setSeen(!user || localStorage.getItem(flagKey(name, user._id)) === "true");
  }, [user?._id]);

  const dismiss = () => {
    if (user) localStorage.setItem(flagKey(name, user._id), "true");
    setSeen(true);
  };

  return { isVisible: Boolean(user) && !seen, dismiss };
}

export function OnboardingProvider({ children }) {
  const { user, loading } = useAuth();

  const navTour = useStepFlow(NAV_STEPS, "nav", user);
  const writeTour = useStepFlow(WRITE_STEPS, "write", user);
  const chatHint = useDismissFlag("chatHint", user);

  // Kullanıcı /select-interests'i tamamlayıp Layout kabuğuna ilk ulaştığında
  // (ya da zaten ilgi alanı varsa login'den direkt) tetiklenir.
  useEffect(() => {
    if (!loading && user) navTour.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, loading]);

  return (
    <OnboardingContext.Provider
      value={{
        activeStepId: navTour.activeStepId,
        step: navTour.step,
        stepNumber: navTour.stepNumber,
        totalSteps: navTour.totalSteps,
        next: navTour.next,
        skip: navTour.skip,

        writeStepId: writeTour.activeStepId,
        writeStep: writeTour.step,
        writeStepNumber: writeTour.stepNumber,
        writeTotalSteps: writeTour.totalSteps,
        writeNext: writeTour.next,
        writeSkip: writeTour.skip,
        startWriteTour: writeTour.start,

        isChatHintVisible: chatHint.isVisible,
        dismissChatHint: chatHint.dismiss,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () =>
  useContext(OnboardingContext) || {
    activeStepId: null,
    step: null,
    stepNumber: 0,
    totalSteps: 0,
    next: () => {},
    skip: () => {},

    writeStepId: null,
    writeStep: null,
    writeStepNumber: 0,
    writeTotalSteps: 0,
    writeNext: () => {},
    writeSkip: () => {},
    startWriteTour: () => {},

    isChatHintVisible: false,
    dismissChatHint: () => {},
  };
