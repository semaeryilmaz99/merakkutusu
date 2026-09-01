import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

export default function ForgotPassword() {
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
      setError(err.response?.data?.message || "İşlem başarısız oldu, tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-50 p-6 shadow-xl">
        {isDone ? (
          <p className="text-center text-brand-900">
            <strong>{email}</strong> adresine bir şifre sıfırlama linki gönderdik. Mailinizi kontrol edin.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-4 text-center text-sm text-gray-500">
              Hesabınıza ait email adresini girin, şifre sıfırlama linki gönderelim.
            </p>
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {error && <p className="mb-4 text-center text-sm text-accent-coral">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </form>
        )}

        <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline">
          Login sayfasına dön
        </Link>
      </div>
    </div>
  );
}
