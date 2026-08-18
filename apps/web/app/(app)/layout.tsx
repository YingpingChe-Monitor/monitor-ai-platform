import { AppShell } from "@/components/app-shell"
import { AuthGuard } from "@/hooks/use-auth-guard"

// (app) route group: everything behind the sidebar shell requires a session.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
