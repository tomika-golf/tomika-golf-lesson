import { AuthProvider } from "@/contexts/AuthContext";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
