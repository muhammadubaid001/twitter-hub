import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../hooks/useAuthSession';

export function AuthPage() {
	const navigate = useNavigate();
	const { session } = useAuthSession();

	useEffect(() => {
		if (session) navigate('/dashboard');
	}, [session, navigate]);

	return (
		<div className="max-w-md mx-auto px-4 py-12">
			<h2 className="text-2xl font-semibold">Welcome</h2>
			<p className="text-sm text-gray-600 mt-1">Login or create an account</p>
			<div className="mt-6 border rounded-xl bg-white p-6">
				<Auth
					supabaseClient={supabase}
					appearance={{ theme: ThemeSupa }}
					socialLayout="hidden"
				/>
			</div>
		</div>
	);
}
