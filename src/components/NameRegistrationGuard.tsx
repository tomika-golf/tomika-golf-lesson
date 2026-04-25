"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

export function NameRegistrationGuard({ children }: { children: React.ReactNode }) {
  const { isReady, needsRegistration } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && needsRegistration && pathname !== "/register") {
      router.replace("/register");
    }
  }, [isReady, needsRegistration, pathname, router]);

  return <>{children}</>;
}
