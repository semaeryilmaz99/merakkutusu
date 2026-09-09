import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import AuthStatusPanel from "../components/UI/AuthStatusPanel";

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
      <div className="w-full max-w-sm rounded-2xl bg-gray-50 p-6 shadow-xl">
        {status === "loading" && <p className="text-center text-brand-900">Doğrulanıyor...</p>}

        {status === "success" && (
          <AuthStatusPanel variant="success" linkLabel="Giriş Yap" linkVariant="button">
            {message}
          </AuthStatusPanel>
        )}

        {status === "error" && <AuthStatusPanel variant="error">{message}</AuthStatusPanel>}
      </div>
    </div>
  );
}
