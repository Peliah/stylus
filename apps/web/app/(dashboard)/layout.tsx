import { AuthSessionProvider } from "@/components/providers/session-provider"

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>
}
