import { db } from '../db';
import { type UnlikeVideoInput } from '../schema';
import { sql } from 'drizzle-orm';

export async function unlikeVideo(input: UnlikeVideoInput): Promise<boolean> {
  try {
    // First verify that the user exists
    const userCheck = await db.execute(sql`
      SELECT id FROM users WHERE id = ${input.user_id}
    `);

    if (userCheck.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify that the video exists
    const videoCheck = await db.execute(sql`
      SELECT id FROM videos WHERE id = ${input.video_id}
    `);

    if (videoCheck.rows.length === 0) {
      throw new Error('Video not found');
    }

    // Check if the like exists
    const likeCheck = await db.execute(sql`
      SELECT id FROM likes 
      WHERE user_id = ${input.user_id} AND video_id = ${input.video_id}
    `);

    // If like doesn't exist, return false
    if (likeCheck.rows.length === 0) {
      return false;
    }

    // Use transaction to remove like and update video like count
    await db.transaction(async (tx) => {
      // Remove the like record
      await tx.execute(sql`
        DELETE FROM likes 
        WHERE user_id = ${input.user_id} AND video_id = ${input.video_id}
      `);

      // Decrement the video's like count
      await tx.execute(sql`
        UPDATE videos 
        SET like_count = like_count - 1, updated_at = NOW()
        WHERE id = ${input.video_id}
      `);
    });

    return true;
  } catch (error) {
    console.error('Video unlike failed:', error);
    throw error;
  }
}