import { supabase } from '../lib/supabaseClient';
import type { CreatePostInput, Post, UpdatePostInput } from '../types';

const POSTS_TABLE = 'posts';
const STORAGE_BUCKET = 'post-images';

export async function listPostsByUser(userId: string): Promise<Post[]> {
	const { data, error } = await supabase
		.from<Post>(POSTS_TABLE)
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function uploadImage(file: File, userId: string): Promise<{ publicUrl: string; path: string }> {
	const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`;
	const { error: uploadError } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(filePath, file, { upsert: false });
	if (uploadError) throw uploadError;
	const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
	return { publicUrl: data.publicUrl, path: filePath };
}

export async function createPost(input: CreatePostInput, userId: string): Promise<Post> {
	let imageUrl: string | null = null;
	if (input.imageFile) {
		const { publicUrl } = await uploadImage(input.imageFile, userId);
		imageUrl = publicUrl;
	}
	const { data, error } = await supabase
		.from<Post>(POSTS_TABLE)
		.insert({
			user_id: userId,
			title: input.title,
			description: input.description ?? null,
			image_url: imageUrl,
		})
		.select()
		.single();
	if (error) throw error;
	return data as Post;
}

export async function updatePost(postId: string, input: UpdatePostInput, userId: string): Promise<Post> {
	let imageUrlUpdate: string | undefined;
	if (input.imageFile) {
		const { publicUrl } = await uploadImage(input.imageFile, userId);
		imageUrlUpdate = publicUrl;
	}
	const updatePayload: Record<string, unknown> = {};
	if (typeof input.title !== 'undefined') updatePayload.title = input.title;
	if (typeof input.description !== 'undefined') updatePayload.description = input.description;
	if (typeof imageUrlUpdate !== 'undefined') updatePayload.image_url = imageUrlUpdate;

	const { data, error } = await supabase
		.from<Post>(POSTS_TABLE)
		.update(updatePayload)
		.eq('id', postId)
		.select()
		.single();
	if (error) throw error;
	return data as Post;
}

export async function deletePost(postId: string): Promise<void> {
	const { error } = await supabase.from(POSTS_TABLE).delete().eq('id', postId);
	if (error) throw error;
}
