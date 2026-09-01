import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

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

  if (isDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-gray-50 p-6 text-center shadow-xl">
          <p className="text-brand-900">
            Kayıt başarılı! <strong>{form.email}</strong> adresine bir doğrulama maili gönderdik.
            Giriş yapabilmek için mailinizdeki linke tıklayın.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Login sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-brand-800 p-6 shadow-xl">
        <Link
          to="/"
          aria-label="Kapat"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-900 hover:bg-gray-100"
        >
          <X size={16} />
        </Link>

        <form onSubmit={handleSubmit} className="mt-8">
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
            label="Username"
            type="text"
            required
            value={form.username}
            onChange={handleChange("username")}
            error={fieldErrors.username}
            autoComplete="username"
          />
          <Input
            label="Password"
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

          <Button type="submit" variant="light" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Signup"}
          </Button>

          <p className="mt-4 rounded-full bg-white/10 px-4 py-2 text-center text-xs text-white">
            Zaten hesabınız var mı?{" "}
            <Link to="/login" className="font-semibold text-accent-gold hover:underline">
              Giriş yapın
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
