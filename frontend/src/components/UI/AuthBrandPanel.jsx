import { useTranslation } from "react-i18next";

// Login/Register/ForgotPassword/ResetPassword/VerifyEmail — auth akışının her
// adımının masaüstünde paylaştığı marka paneli (sol yarı, dekoratif daireler +
// başlık/slogan). Tek yerde tutuluyor ki beş sayfa birbirinden sürüklenmesin.
export default function AuthBrandPanel() {
  const { t } = useTranslation("auth");

  return (
    <div className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-16">
      <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full border-2 border-accent-gold/30" />
      <div className="pointer-events-none absolute -right-12 top-8 h-56 w-56 rounded-full bg-teal-700/30" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-accent-gold/10" />
      <h1 className="relative text-4xl font-bold text-white">merakkutusu</h1>
      <p className="relative mt-3 max-w-xs text-sm text-white/70">{t("tagline")}</p>
    </div>
  );
}
