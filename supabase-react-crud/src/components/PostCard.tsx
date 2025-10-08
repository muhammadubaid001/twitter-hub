import { useState } from 'react';
import type { Post, UpdatePostInput } from '../types';
import { PostForm } from './PostForm';

type PostCardProps = {
	post: Post;
	onUpdate: (postId: string, input: UpdatePostInput) => Promise<void> | void;
	onDelete: (postId: string) => Promise<void> | void;
};

export function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
	const [isEditing, setIsEditing] = useState(false);

	return (
		<div className="rounded-lg border bg-white p-3">
			{isEditing ? (
				<div>
					<PostForm
						initial={{ title: post.title, description: post.description ?? '' }}
						onsubmit={async (input) => {
							await onUpdate(post.id, input);
							setIsEditing(false);
						}}
						submitLabel="Update"
					/>
					<div className="mt-2 flex justify-end">
						<button onClick={() => setIsEditing(false)} className="text-sm text-gray-600">Cancel</button>
					</div>
				</div>
			) : (
				<div className="flex gap-3">
					{post.image_url ? (
						<img src={post.image_url} alt={post.title} className="h-20 w-20 object-cover rounded" />
					) : (
						<div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
					)}
					<div className="flex-1">
						<div className="flex items-start justify-between">
							<div>
								<h3 className="font-medium">{post.title}</h3>
								<p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
							</div>
							<div className="flex items-center gap-3">
								<button onClick={() => setIsEditing(true)} className="text-sm text-blue-600">Edit</button>
								<button onClick={() => onDelete(post.id)} className="text-sm text-red-600">Delete</button>
							</div>
						</div>
						{post.description && <p className="mt-2 text-sm text-gray-700">{post.description}</p>}
					</div>
				</div>
			)}
		</div>
	);
}
