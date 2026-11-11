import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../services/authService";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AuthBrandPanel from "../components/UI/AuthBrandPanel";

export default function Login() {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      const me = await getMe();
      const hasInterests = me.favoriteTags?.length > 0;
      navigate(hasInterests ? "/" : "/select-interests", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t("login.genericError"));
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

          <form onSubmit={handleSubmit}>
            <Input
              label={t("login.usernameOrEmailLabel")}
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label={t("passwordLabel")}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && <p className="mb-4 text-center text-sm text-accent-coral">{error}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </Button>

            <Link
              to="/forgot-password"
              className="mt-3 block text-center text-xs font-medium text-brand-700 hover:underline"
            >
              {t("login.forgotPassword")}
            </Link>

            <p className="mt-4 text-center text-xs text-gray-500">
              {t("login.noAccount")}{" "}
              <Link to="/register" className="font-semibold text-brand-700 hover:underline">
                {t("login.registerLink")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
