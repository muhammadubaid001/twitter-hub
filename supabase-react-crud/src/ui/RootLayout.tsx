import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function RootLayout() {
	const navigate = useNavigate();
	const [isAuthed, setIsAuthed] = useState(false);

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setIsAuthed(Boolean(data.session));
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setIsAuthed(Boolean(session));
		});
		return () => {
			sub.subscription.unsubscribe();
		};
	}, []);

	async function handleLogout() {
		await supabase.auth.signOut();
		navigate('/');
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="border-b bg-white">
				<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
					<Link to="/" className="font-semibold text-lg">Supabase CRUD</Link>
					<nav className="flex items-center gap-3">
						<Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link>
						{isAuthed ? (
							<>
								<Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
								<button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Logout</button>
							</>
						) : (
							<Link to="/auth" className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-sm">Login</Link>
						)}
					</nav>
				</div>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
			<footer className="border-t bg-white">
				<div className="max-w-6xl mx-auto px-4 py-6 text-xs text-gray-500">© {new Date().getFullYear()} Supabase CRUD</div>
			</footer>
		</div>
	);
}
