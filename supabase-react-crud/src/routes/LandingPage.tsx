import { Link, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';

export function LandingPage() {
	const { user, loading } = useAuthSession();
	const navigate = useNavigate();

	function handleGetStarted() {
		if (user) navigate('/dashboard');
		else navigate('/auth');
	}

	return (
		<section className="relative isolate">
			<div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
				<div className="grid md:grid-cols-2 gap-10 items-center">
					<div>
						<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Build posts with React + Supabase</h1>
						<p className="mt-4 text-gray-600 text-lg">Create, edit, and delete your posts with image uploads, secured by Supabase Auth.</p>
						<div className="mt-6 flex items-center gap-4">
							<button onClick={handleGetStarted} className="inline-flex items-center rounded-md bg-black text-white px-5 py-2.5 text-sm">
								{loading ? 'Loading…' : user ? 'Go to Dashboard' : 'Get Started'}
							</button>
							<Link to="/auth" className="text-sm text-gray-700">Login</Link>
						</div>
					</div>
					<div className="border rounded-xl bg-white p-6 shadow-sm">
						<div className="text-sm font-medium text-gray-500">Features</div>
						<ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-4">
							<li>Supabase Auth (email/password)</li>
							<li>CRUD for posts with images</li>
							<li>Responsive Tailwind UI</li>
							<li>React Router + React Query</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
