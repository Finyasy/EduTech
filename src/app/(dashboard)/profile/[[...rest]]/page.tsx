import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/shared/SiteHeader";

const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.startsWith("pk_") && !key.endsWith("..."));
};

export default async function ProfilePage() {
  if (!isClerkConfigured()) {
    return (
      <div className="min-h-screen bg-amber-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-10">
          <div className="rounded-3xl border border-amber-200 bg-amber-100/70 p-6 text-sm text-amber-900">
            Profile settings are unavailable until Clerk keys are added to{" "}
            <code className="rounded bg-amber-200/70 px-1">.env</code>.
          </div>
        </main>
      </div>
    );
  }

  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/profile")}`);
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-10">
        <UserProfile
          appearance={{
            elements: {
              card: "rounded-3xl border border-white/70 shadow-sm",
            },
          }}
        />
      </main>
    </div>
  );
}
