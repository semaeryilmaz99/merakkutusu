import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

export default function ResetPassword() {
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
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Şifre sıfırlanamadı, tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-gray-50 p-6 text-center shadow-xl">
          <p className="text-brand-900">Şifren başarıyla sıfırlandı.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Giriş sayfasına git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-50 p-6 shadow-xl">
        <form onSubmit={handleSubmit}>
          <Input
            label="Yeni Şifre"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Yeni Şifre (Tekrar)"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {error && <p className="mb-4 text-center text-sm text-accent-coral">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Şifreyi Sıfırla"}
          </Button>
        </form>

        <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline">
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}
