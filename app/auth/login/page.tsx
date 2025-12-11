"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = useMemo(() => searchParams.get("redirect") || "/", [searchParams]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Prevent body scroll bleed while modal is open
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleAuthSuccess = () => {
    setOpen(false);
    router.replace(redirect);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-twilight text-parchment">
      <AuthModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onContinueAsGuest={() => router.replace("/")}
        onAuthSuccess={handleAuthSuccess}
      />
      <div className="sr-only" aria-live="polite">
        Authentication required to continue to StudyHarbor.
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
