import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Post, CreatePostInput, UpdatePostInput } from '../types';
import { listPostsByUser, createPost, updatePost, deletePost } from '../services/posts';

const postsKey = (userId: string) => ['posts', userId];

export function usePosts(userId: string | undefined) {
	const qc = useQueryClient();

	const listQuery = useQuery({
		queryKey: postsKey(userId ?? 'anonymous'),
		queryFn: () => listPostsByUser(userId!),
		enabled: Boolean(userId),
	});

	const createMut = useMutation({
		mutationFn: (input: CreatePostInput) => createPost(input, userId!),
		onSuccess: () => qc.invalidateQueries({ queryKey: postsKey(userId!) }),
	});

	const updateMut = useMutation({
		mutationFn: ({ postId, input }: { postId: string; input: UpdatePostInput }) => updatePost(postId, input, userId!),
		onSuccess: () => qc.invalidateQueries({ queryKey: postsKey(userId!) }),
	});

	const deleteMut = useMutation({
		mutationFn: (postId: string) => deletePost(postId),
		onSuccess: () => qc.invalidateQueries({ queryKey: postsKey(userId!) }),
	});

	return {
		listQuery,
		createMut,
		updateMut,
		deleteMut,
	} as const;
}
