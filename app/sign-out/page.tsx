import Link from "next/link";
import { IconBarbell } from "@tabler/icons-react";

export const metadata = {
  title: "Déconnexion — FitConnect",
};

export default function SignOutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="flex w-full max-w-[360px] flex-col items-center text-center">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[#E1F5EE]">
          <IconBarbell size={26} className="text-[#0F6E56]" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-zinc-900">À bientôt !</h1>
        <p className="mt-2 text-[13px] text-zinc-500">
          Tu as bien été déconnecté de FitConnect
        </p>

        <Link
          href="/sign-in"
          className="mt-6 w-full rounded-md bg-[#0F6E56] px-4 py-[13px] text-center text-[14px] font-medium text-white transition hover:opacity-90"
        >
          Se reconnecter
        </Link>
        <Link
          href="/"
          className="mt-4 text-[13px] text-zinc-500 hover:text-zinc-700"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
