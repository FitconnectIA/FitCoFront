import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { AuthHeader } from "@/app/(auth)/_components/auth-header";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <>
      <AuthHeader title="Bon retour" subtitle="Connecte-toi à ton compte" />
      <SignIn appearance={clerkAppearance} />
      <p className="mt-6 text-center text-[13px] text-zinc-500">
        Pas de compte ?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-[#0F6E56] hover:underline"
        >
          S&apos;inscrire
        </Link>
      </p>
    </>
  );
}
