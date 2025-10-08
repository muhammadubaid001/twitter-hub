export type Post = {
	id: string;
	user_id: string;
	title: string;
	description: string | null;
	image_url: string | null;
	created_at: string;
};

export type CreatePostInput = {
	title: string;
	description?: string;
	imageFile?: File | null;
};

export type UpdatePostInput = {
	title?: string;
	description?: string;
	imageFile?: File | null;
};
