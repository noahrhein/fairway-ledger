import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if profile is complete; if not, route to onboarding.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        if (!profile || !profile.display_name || profile.display_name.includes('@') === false && profile.display_name.length < 1) {
          return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
        }
        // First-time users (auto-created profile uses email prefix) — let them confirm name.
        const isFirstTime = profile.display_name === user.email?.split('@')[0];
        if (isFirstTime) {
          return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
