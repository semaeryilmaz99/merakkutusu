import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { verifyEmail } from "../services/authService";
import AuthStatusPanel from "../components/UI/AuthStatusPanel";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AuthBrandPanel from "../components/UI/AuthBrandPanel";

export default function VerifyEmail() {
  const { t } = useTranslation("auth");
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const hasRequested = useRef(false);

  useEffect(() => {
    // Doğrulama token'ı tek kullanımlık — React StrictMode dev modunda
    // efekti iki kez çalıştırdığı için ikinci çağrı yanlışlıkla "geçersiz
    // token" hatası verir. Bu ref, istek sadece bir kez atılsın diye var.
    if (hasRequested.current) return;
    hasRequested.current = true;

    verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || t("verifyEmail.genericError"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      <div className="absolute right-4 top-4 z-10 lg:right-6 lg:top-6">
        <LanguageSwitcher />
      </div>

      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm">
          <h2 className="mb-8 text-center text-xl font-bold text-brand-900 lg:hidden">merakkutusu</h2>

          {status === "loading" && <p className="text-center text-brand-900">{t("verifyEmail.verifying")}</p>}

          {status === "success" && (
            <AuthStatusPanel variant="success" linkLabel={t("login.submit")} linkVariant="button">
              {message}
            </AuthStatusPanel>
          )}

          {status === "error" && <AuthStatusPanel variant="error">{message}</AuthStatusPanel>}
        </div>
      </div>
    </div>
  );
}
