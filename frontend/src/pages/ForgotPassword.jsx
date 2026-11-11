import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { forgotPassword } from "../services/authService";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import AuthStatusPanel from "../components/UI/AuthStatusPanel";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AuthBrandPanel from "../components/UI/AuthBrandPanel";

export default function ForgotPassword() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
      setIsDone(true);
    } catch (err) {
      setError(err.response?.data?.message || t("forgotPassword.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      <div className="absolute right-4 top-4 z-10 lg:right-6 lg:top-6">
        <LanguageSwitcher />
      </div>

      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm">
          <h2 className="mb-8 text-center text-xl font-bold text-brand-900 lg:hidden">merakkutusu</h2>

          {isDone ? (
            <AuthStatusPanel variant="success" linkTo={null}>
              {t("forgotPassword.success", { email })}
            </AuthStatusPanel>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-4 text-center text-sm text-gray-500">{t("forgotPassword.intro")}</p>
              <Input
                label={t("register.emailLabel")}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {error && <p className="mb-4 text-center text-sm text-accent-coral">{error}</p>}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
              </Button>
            </form>
          )}

          <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline">
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
