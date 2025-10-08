import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthSession } from '../hooks/useAuthSession';
import { usePosts } from '../hooks/usePosts';
import { PostForm } from '../components/PostForm';
import { PostCard } from '../components/PostCard';

export function DashboardPage() {
	const navigate = useNavigate();
	const { user, loading } = useAuthSession();
	const { listQuery, createMut, updateMut, deleteMut } = usePosts(user?.id);

	useEffect(() => {
		if (!loading && !user) navigate('/auth');
	}, [loading, user, navigate]);

	if (loading) {
		return <div className="max-w-6xl mx-auto px-4 py-8">Loading…</div>;
	}

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			<h2 className="text-2xl font-semibold">Dashboard</h2>
			<p className="text-sm text-gray-600 mt-1">Create and manage your posts</p>

			<div className="mt-6 grid md:grid-cols-3 gap-6">
				<div className="md:col-span-1">
					<div className="rounded-xl border bg-white p-4">
						<h3 className="font-medium">Add Post</h3>
						<div className="mt-3">
							<PostForm
								onsubmit={async (input) => {
								try {
									await createMut.mutateAsync(input);
									toast.success('Post created');
								} catch (e: any) {
									toast.error(e.message ?? 'Failed to create post');
								}
							}}
								submitLabel={createMut.isPending ? 'Creating…' : 'Create'}
							/>
						</div>
					</div>
				</div>
				<div className="md:col-span-2">
					<div className="flex items-center justify-between">
						<h3 className="font-medium">Your Posts</h3>
						<button onClick={() => listQuery.refetch()} className="text-sm text-gray-600">Refresh</button>
					</div>
					<div className="mt-3 grid gap-3">
						{listQuery.isLoading ? (
							<div>Loading posts…</div>
						) : listQuery.data && listQuery.data.length > 0 ? (
							listQuery.data.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									onUpdate={async (postId, input) => {
										try {
											await updateMut.mutateAsync({ postId, input });
											toast.success('Post updated');
										} catch (e: any) {
											toast.error(e.message ?? 'Failed to update post');
										}
									}}
									onDelete={async (postId) => {
										try {
											await deleteMut.mutateAsync(postId);
											toast.success('Post deleted');
										} catch (e: any) {
											toast.error(e.message ?? 'Failed to delete post');
										}
									}}
								/>
							))
						) : (
							<div className="text-sm text-gray-600">No posts yet.</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
