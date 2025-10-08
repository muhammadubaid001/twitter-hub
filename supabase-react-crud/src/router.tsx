import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './ui/RootLayout';
import { LandingPage } from './routes/LandingPage';
import { AuthPage } from './routes/AuthPage';
import { DashboardPage } from './routes/DashboardPage';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		children: [
			{ index: true, element: <LandingPage /> },
			{ path: 'auth', element: <AuthPage /> },
			{ path: 'dashboard', element: <DashboardPage /> },
		],
	},
]);
