import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../services/authService";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

export default function Login() {
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
      setError(err.response?.data?.message || "Giriş yapılamadı, tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-gray-50 p-6 shadow-xl">
        <Link
          to="/"
          aria-label="Kapat"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent-gold text-brand-900 hover:brightness-95"
        >
          <X size={16} />
        </Link>

        <form onSubmit={handleSubmit} className="mt-8">
          <Input
            label="Kullanıcı Adı/Email"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Şifre"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <p className="mb-4 text-center text-sm text-accent-coral">{error}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>

          <Link
            to="/forgot-password"
            className="mt-3 block rounded-full bg-gray-200 px-4 py-2 text-center text-xs text-brand-800 hover:bg-gray-300"
          >
            şifreni mi unuttun?
          </Link>

          <p className="mt-4 text-center text-xs text-gray-500">
            Hesabınız yok mu?{" "}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Kayıt olun
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
