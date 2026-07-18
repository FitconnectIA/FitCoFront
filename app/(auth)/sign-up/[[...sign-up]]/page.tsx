import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthHeader } from "@/app/(auth)/_components/auth-header";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <>
      <AuthHeader
        title="FitConnect"
        subtitle="La science du sport accessible à tous"
      />
      <SignUp appearance={clerkAppearance} />
      <p className="mt-6 text-center text-[13px] text-zinc-500">
        Déjà un compte ?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-[#0F6E56] hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}
