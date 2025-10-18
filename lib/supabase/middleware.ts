import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Define public routes that should NEVER require authentication
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/sign-up", 
    "/auth/forgot-password",
    "/auth/update-password",
    "/auth/error",
    "/auth/confirm",
    "/auth/sign-up-success",
    "/login",
    "/portfolio",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === "/") {
      return request.nextUrl.pathname === "/";
    }
    return request.nextUrl.pathname === route || 
           request.nextUrl.pathname.startsWith(route + "/");
  });

  console.log("Middleware - Path:", request.nextUrl.pathname);
  console.log("Middleware - isPublicRoute:", isPublicRoute);

  // For public routes, return immediately without any auth checks
  if (isPublicRoute) {
    console.log("Middleware - Allowing public route");
    // Clear any stale auth cookies for public routes
    if (request.nextUrl.pathname === "/") {
      supabaseResponse.cookies.delete('sb-access-token');
      supabaseResponse.cookies.delete('sb-refresh-token');
    }
    return supabaseResponse;
  }

  // Only for protected routes, check authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Only check authentication for protected routes
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  console.log("Middleware - User authenticated:", !!user);

  // Only redirect to login if user is not authenticated and trying to access protected routes
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/dashboard") ||
     request.nextUrl.pathname.startsWith("/protected"))
  ) {
    console.log("Middleware - Redirecting to login");
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
