import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-out",
]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

const ONBOARDED_COOKIE = "fc_onboarded";
const SYNCED_SID_COOKIE = "fc_synced_sid";

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    const response = NextResponse.next();
    // Après déconnexion, purge les cookies de cache du middleware : sans ça,
    // un autre compte sur le même navigateur sauterait l'onboarding.
    if (req.nextUrl.pathname === "/sign-out") {
      response.cookies.delete(ONBOARDED_COOKIE);
      response.cookies.delete(SYNCED_SID_COOKIE);
    }
    return response;
  }

  await auth.protect();

  // Onboarding already confirmed for this browser — skip the backend round trip.
  if (req.cookies.get(ONBOARDED_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const { sessionId, getToken } = await auth();
  const token = baseUrl ? await getToken() : null;

  if (!baseUrl || !token) {
    return NextResponse.next();
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    // POST /auth/sync only needs to run once per Clerk session.
    if (req.cookies.get(SYNCED_SID_COOKIE)?.value !== sessionId) {
      await fetch(`${baseUrl}/auth/sync`, { method: "POST", headers });
    }

    const meRes = await fetch(`${baseUrl}/users/me`, { headers });
    if (!meRes.ok) {
      return NextResponse.next();
    }

    const user: { onboarding_completed: boolean } = await meRes.json();

    let response: NextResponse;
    if (!user.onboarding_completed && !isOnboardingRoute(req)) {
      response = NextResponse.redirect(new URL("/onboarding", req.url));
    } else if (user.onboarding_completed && isOnboardingRoute(req)) {
      response = NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      response = NextResponse.next();
    }

    response.cookies.set(SYNCED_SID_COOKIE, sessionId ?? "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    if (user.onboarding_completed) {
      response.cookies.set(ONBOARDED_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch {
    // Backend unreachable — fail open rather than locking the user out.
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
