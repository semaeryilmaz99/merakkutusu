import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { verifyEmail } from "../services/authService";

export default function VerifyEmail() {
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
        setMessage(err.response?.data?.message || "Doğrulama başarısız oldu.");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-500 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-50 p-6 text-center shadow-xl">
        {status === "loading" && <p className="text-brand-900">Doğrulanıyor...</p>}

        {status === "success" && (
          <>
            <p className="text-brand-900">{message}</p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Giriş Yap
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-accent-coral">{message}</p>
            <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
              Giriş sayfasına dön
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
