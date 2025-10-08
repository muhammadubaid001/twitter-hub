import { useState } from 'react';
import type { CreatePostInput } from '../types';

type PostFormProps = {
	initial?: { title?: string; description?: string };
	onsubmit: (input: CreatePostInput) => Promise<void> | void;
	submitLabel?: string;
};

export function PostForm({ initial, onsubmit, submitLabel = 'Save' }: PostFormProps) {
	const [title, setTitle] = useState(initial?.title ?? '');
	const [description, setDescription] = useState(initial?.description ?? '');
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			await onsubmit({ title, description, imageFile });
			setTitle('');
			setDescription('');
			setImageFile(null);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<div>
				<label className="block text-sm font-medium">Title</label>
				<input
					required
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
					placeholder="Post title"
				/>
			</div>
			<div>
				<label className="block text-sm font-medium">Description</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
					placeholder="Write something..."
					rows={4}
				/>
			</div>
			<div>
				<label className="block text-sm font-medium">Image</label>
				<input
					type="file"
					accept="image/*"
					onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
					className="mt-1 block w-full text-sm"
				/>
			</div>
			<div className="flex justify-end">
				<button disabled={submitting} className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50">
					{submitting ? 'Submitting…' : submitLabel}
				</button>
			</div>
		</form>
	);
}
