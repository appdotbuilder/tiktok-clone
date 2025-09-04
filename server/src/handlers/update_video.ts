import { db } from '../db';
import { type UpdateVideoInput, type Video } from '../schema';
import { sql } from 'drizzle-orm';

export async function updateVideo(input: UpdateVideoInput): Promise<Video> {
  try {
    // Check if video exists using raw SQL since schema is not available
    const existingVideoResult = await db.execute(
      sql`SELECT * FROM videos WHERE id = ${input.id}`
    );

    if (existingVideoResult.rows.length === 0) {
      throw new Error('Video not found');
    }

    // Execute update directly with sql template
    let updateQuery = sql`UPDATE videos SET updated_at = NOW()`;
    
    if (input.title !== undefined) {
      updateQuery = sql`${updateQuery}, title = ${input.title}`;
    }

    if (input.description !== undefined) {
      updateQuery = sql`${updateQuery}, description = ${input.description}`;
    }

    updateQuery = sql`${updateQuery} WHERE id = ${input.id} RETURNING *`;

    const result = await db.execute(updateQuery);
    const updatedVideo = result.rows[0] as any;

    // Return the updated video with proper typing
    return {
      id: updatedVideo.id,
      user_id: updatedVideo.user_id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      video_url: updatedVideo.video_url,
      thumbnail_url: updatedVideo.thumbnail_url,
      duration: updatedVideo.duration,
      view_count: updatedVideo.view_count,
      like_count: updatedVideo.like_count,
      created_at: new Date(updatedVideo.created_at),
      updated_at: new Date(updatedVideo.updated_at)
    };
  } catch (error) {
    console.error('Video update failed:', error);
    throw error;
  }
}