import { db } from '../db';
import { type UserProfile } from '../schema';
import { sql } from 'drizzle-orm';

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  try {
    // First, get the user data using raw SQL
    const users = await db.execute(
      sql`SELECT * FROM users WHERE id = ${userId}`
    );

    if (users.rows.length === 0) {
      return null;
    }

    const user = users.rows[0] as any;

    // Then, get all videos by this user using raw SQL
    const videos = await db.execute(
      sql`SELECT * FROM videos WHERE user_id = ${userId}`
    );

    // Return the user profile with videos
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at),
      videos: videos.rows.map((video: any) => ({
        id: video.id,
        user_id: video.user_id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        view_count: video.view_count,
        like_count: video.like_count,
        created_at: new Date(video.created_at),
        updated_at: new Date(video.updated_at)
      }))
    };
  } catch (error) {
    console.error('Get user profile failed:', error);
    throw error;
  }
}