import { Suspense } from "react"
import type { Metadata } from "next"

import { InviteSetupForm } from "@/components/invite-setup-form"

export const metadata: Metadata = { title: "Monitor G5 Adaptation Platform" }

// Invite landing page (story 6): first-time password setup activates the
// account. Deliberately NOT wrapped in GuestOnlyGuard — the invitee may have
// no session at all; the token itself is the credential.
export default async function InvitePage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Suspense>
        <InviteSetupForm />
      </Suspense>
    </div>
  )
}
