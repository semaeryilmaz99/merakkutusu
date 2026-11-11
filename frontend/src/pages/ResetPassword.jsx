import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resetPassword } from "../services/authService";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import AuthStatusPanel from "../components/UI/AuthStatusPanel";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AuthBrandPanel from "../components/UI/AuthBrandPanel";

export default function ResetPassword() {
  const { t } = useTranslation("auth");
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("resetPassword.mismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsDone(true);
    } catch (err) {
      setError(err.response?.data?.message || t("resetPassword.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <div className="absolute right-4 top-4 z-10 lg:right-6 lg:top-6">
          <LanguageSwitcher />
        </div>

        <AuthBrandPanel />

        <div className="flex flex-1 items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-sm">
            <h2 className="mb-8 text-center text-xl font-bold text-brand-900 lg:hidden">merakkutusu</h2>
            <AuthStatusPanel variant="success" linkLabel={t("resetPassword.successLinkLabel")}>
              {t("resetPassword.successMessage")}
            </AuthStatusPanel>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      <div className="absolute right-4 top-4 z-10 lg:right-6 lg:top-6">
        <LanguageSwitcher />
      </div>

      <AuthBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm">
          <h2 className="mb-8 text-center text-xl font-bold text-brand-900 lg:hidden">merakkutusu</h2>

          <form onSubmit={handleSubmit}>
            <Input
              label={t("resetPassword.newPasswordLabel")}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              label={t("resetPassword.confirmPasswordLabel")}
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && <p className="mb-4 text-center text-sm text-accent-coral">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("resetPassword.submitting") : t("resetPassword.submit")}
            </Button>
          </form>

          <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline">
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
