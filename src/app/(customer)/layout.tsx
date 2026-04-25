import { AuthProvider } from "@/contexts/AuthContext";
import { NameRegistrationGuard } from "@/components/NameRegistrationGuard";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NameRegistrationGuard>{children}</NameRegistrationGuard>
    </AuthProvider>
  );
}
