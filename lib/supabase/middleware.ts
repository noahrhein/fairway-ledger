import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Only /app/* is gated. Landing, /login, /auth, /share, /onboarding stay public.
const APP_PREFIX = '/app';
const ONBOARDING_PATH = '/onboarding';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAppRoute = path === APP_PREFIX || path.startsWith(APP_PREFIX + '/');

  // Only /app/* requires auth. Landing page and other roots are public.
  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Force-redirect signed-in users to onboarding before they reach /app/*.
  if (user && isAppRoute && path !== ONBOARDING_PATH) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .single();
    if (!profile?.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_PATH;
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

