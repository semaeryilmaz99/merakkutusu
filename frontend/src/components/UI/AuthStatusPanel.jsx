import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";

const ICONS = { success: CheckCircle2, error: AlertCircle };
const ICON_CLASS = { success: "text-teal-700", error: "text-accent-coral" };
const TEXT_CLASS = { success: "text-brand-900", error: "text-accent-coral" };

// Register/ForgotPassword/ResetPassword/VerifyEmail'in başarı ve hata
// durumlarının paylaştığı ortak yüzey — her sayfa aynı düz paragrafı ayrı
// ayrı yazıyordu, burada bir ikonla birlikte "kendi alanı" olan tek bir yer.
export default function AuthStatusPanel({
  variant = "success",
  children,
  linkTo = "/login",
  linkLabel = "Giriş sayfasına dön",
  linkVariant = "text",
}) {
  const Icon = ICONS[variant];

  return (
    <div className="text-center">
      <Icon size={36} className={`mx-auto mb-3 ${ICON_CLASS[variant]}`} />
      <p className={TEXT_CLASS[variant]}>{children}</p>
      {linkTo &&
        (linkVariant === "button" ? (
          <Link
            to={linkTo}
            className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {linkLabel}
          </Link>
        ) : (
          <Link to={linkTo} className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            {linkLabel}
          </Link>
        ))}
    </div>
  );
}
