"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") !== null;

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/chat`,
        },
      });
    } catch {
      setLoading(false);
      setError("Gagal terhubung. Coba lagi.");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      {/* ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)",
        }}
      />

      <div className="flex-1 flex flex-col justify-center px-5 pb-8 pt-8 relative z-10 lg:max-w-md lg:mx-auto lg:w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <Link href="/" className="inline-flex flex-col items-center group">
            <svg
              width="48"
              height="48"
              viewBox="0 0 72 72"
              fill="none"
              className="mx-auto mb-3 transition-opacity group-hover:opacity-80"
            >
              <circle cx="36" cy="36" r="34" stroke="url(#lg1)" strokeWidth="5" />
              <path
                d="M20 38 Q27 28 36 36 Q45 44 52 34"
                stroke="url(#lg1)"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M20 44 Q27 34 36 42 Q45 50 52 40"
                stroke="url(#lg2)"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.55"
              />
              <circle cx="36" cy="36" r="4.5" fill="url(#lg1)" />
              <defs>
                <linearGradient id="lg1" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#7C5CFC" />
                </linearGradient>
                <linearGradient id="lg2" x1="20" y1="36" x2="52" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FBB724" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
              </defs>
            </svg>
            <h1
              className="text-3xl font-bold tracking-tight transition-opacity group-hover:opacity-80"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
            >
              finara
            </h1>
          </Link>
          <p
            className="text-xs mt-1 font-medium"
            style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}
          >
            KEUANGAN PRIBADIMU
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Masuk ke Finara
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Gunakan akun Google kamu untuk masuk.
          </p>

          <AnimatePresence>
            {(hasError || error) && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs px-1 mb-4"
                style={{ color: "var(--danger)" }}
              >
                {error || "Login gagal. Coba lagi atau hubungi support."}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleGoogleLogin}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3 transition-opacity disabled:opacity-60"
            style={{
              background: "#FFFFFF",
              color: "#1F1F1F",
              border: "1px solid #E0E0E0",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ color: "#1F1F1F" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? "Mengarahkan..." : "Masuk dengan Google"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
