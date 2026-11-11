import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import AuthStatusPanel from "../components/UI/AuthStatusPanel";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AuthBrandPanel from "../components/UI/AuthBrandPanel";

export default function Register() {
  const { t } = useTranslation("auth");
  const { register } = useAuth();

  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register(form.username, form.email, form.password);
      setIsDone(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setFieldErrors(Object.fromEntries(data.errors.map((e) => [e.field, e.message])));
      }
      setError(data?.message || t("register.genericError"));
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
            <AuthStatusPanel variant="success">{t("register.success", { email: form.email })}</AuthStatusPanel>
          ) : (
            <form onSubmit={handleSubmit}>
              <Input
                label={t("register.emailLabel")}
                type="email"
                required
                value={form.email}
                onChange={handleChange("email")}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Input
                label={t("register.usernameLabel")}
                type="text"
                required
                value={form.username}
                onChange={handleChange("username")}
                error={fieldErrors.username}
                autoComplete="username"
              />
              <Input
                label={t("passwordLabel")}
                type="password"
                required
                value={form.password}
                onChange={handleChange("password")}
                error={fieldErrors.password}
                autoComplete="new-password"
              />

              {error && !Object.keys(fieldErrors).length && (
                <p className="mb-4 text-center text-sm text-accent-coral">{error}</p>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("register.submitting") : t("register.submit")}
              </Button>

              <p className="mt-4 text-center text-xs text-gray-500">
                {t("register.hasAccount")}{" "}
                <Link to="/login" className="font-semibold text-brand-700 hover:underline">
                  {t("register.loginLink")}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
