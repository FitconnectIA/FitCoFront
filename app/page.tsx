import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// Le middleware gère ensuite la redirection onboarding/dashboard selon
// onboarding_completed côté backend.
export default async function Home() {
  const { userId } = await auth();
  redirect(userId ? "/dashboard" : "/sign-in");
}
