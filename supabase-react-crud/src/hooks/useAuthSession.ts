import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export function useAuthSession() {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		supabase.auth.getSession().then(({ data }) => {
			if (!isMounted) return;
			setSession(data.session);
			setUser(data.session?.user ?? null);
			setLoading(false);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
			setUser(nextSession?.user ?? null);
		});
		return () => {
			isMounted = false;
			sub.subscription.unsubscribe();
		};
	}, []);

	return { session, user, loading } as const;
}
