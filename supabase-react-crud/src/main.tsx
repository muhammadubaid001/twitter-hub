import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { router } from './router';

const queryClient = new QueryClient();

const rootElem = document.getElementById('root');
if (!rootElem) {
	throw new Error('Root element not found');
}

createRoot(rootElem).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			<Toaster />
		</QueryClientProvider>
	</React.StrictMode>
);
