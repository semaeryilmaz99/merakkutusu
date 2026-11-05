import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import AuthStatusPanel from "../components/UI/AuthStatusPanel";

export default function Register() {
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
      setError(data?.message || "Kayıt olunamadı, tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      <Link
        to="/"
        aria-label="Kapat"
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-accent-gold text-brand-900 hover:brightness-95 lg:right-6 lg:top-6"
      >
        <X size={16} />
      </Link>

      {/* Login.jsx ile birebir aynı marka paneli — kayıt akışı da uygulamanın
          "ön kapısı"nın bir parçası, aynı ilk izlenimi vermeli. */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-16">
        <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full border-2 border-accent-gold/30" />
        <div className="pointer-events-none absolute -right-12 top-8 h-56 w-56 rounded-full bg-teal-700/30" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-accent-gold/10" />
        <h1 className="relative text-4xl font-bold text-white">merakkutusu</h1>
        <p className="relative mt-3 max-w-xs text-sm text-white/70">
          Merak ettiğin her şeyi keşfet, okuduklarını biriktir, kendi bilgini paylaş.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm">
          <h2 className="mb-8 text-center text-xl font-bold text-brand-900 lg:hidden">merakkutusu</h2>

          {isDone ? (
            <AuthStatusPanel variant="success">
              Kayıt başarılı! <strong>{form.email}</strong> adresine bir doğrulama maili gönderdik. Giriş yapabilmek
              için mailinizdeki linke tıklayın.
            </AuthStatusPanel>
          ) : (
            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={handleChange("email")}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Input
                label="Kullanıcı Adı"
                type="text"
                required
                value={form.username}
                onChange={handleChange("username")}
                error={fieldErrors.username}
                autoComplete="username"
              />
              <Input
                label="Şifre"
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
                {isSubmitting ? "Kaydediliyor..." : "Kayıt Ol"}
              </Button>

              <p className="mt-4 text-center text-xs text-gray-500">
                Zaten hesabınız var mı?{" "}
                <Link to="/login" className="font-semibold text-brand-700 hover:underline">
                  Giriş yapın
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
