import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  display_name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Video schema
export const videoSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  video_url: z.string(),
  thumbnail_url: z.string().nullable(),
  duration: z.number(), // duration in seconds
  view_count: z.number(),
  like_count: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Video = z.infer<typeof videoSchema>;

// Like schema
export const likeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  video_id: z.number(),
  created_at: z.coerce.date()
});

export type Like = z.infer<typeof likeSchema>;

// Input schemas for user operations
export const registerUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  display_name: z.string().nullable().optional()
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  display_name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Input schemas for video operations
export const createVideoInputSchema = z.object({
  user_id: z.number(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  video_url: z.string().url(),
  thumbnail_url: z.string().url().nullable().optional(),
  duration: z.number().positive()
});

export type CreateVideoInput = z.infer<typeof createVideoInputSchema>;

export const updateVideoInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional()
});

export type UpdateVideoInput = z.infer<typeof updateVideoInputSchema>;

// Input schemas for like operations
export const likeVideoInputSchema = z.object({
  user_id: z.number(),
  video_id: z.number()
});

export type LikeVideoInput = z.infer<typeof likeVideoInputSchema>;

export const unlikeVideoInputSchema = z.object({
  user_id: z.number(),
  video_id: z.number()
});

export type UnlikeVideoInput = z.infer<typeof unlikeVideoInputSchema>;

// Video feed schema (video with user info)
export const videoFeedItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  video_url: z.string(),
  thumbnail_url: z.string().nullable(),
  duration: z.number(),
  view_count: z.number(),
  like_count: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  // User information
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable()
});

export type VideoFeedItem = z.infer<typeof videoFeedItemSchema>;

// User profile with videos schema
export const userProfileSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  videos: z.array(videoSchema)
});

export type UserProfile = z.infer<typeof userProfileSchema>;