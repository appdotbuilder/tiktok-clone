import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB } from '../helpers';
import { db } from '../db';
import { type UnlikeVideoInput } from '../schema';
import { unlikeVideo } from '../handlers/unlike_video';
import { sql } from 'drizzle-orm';

const createTestTables = async () => {
  // Create users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      bio TEXT,
      avatar_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Create videos table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      video_url VARCHAR(500) NOT NULL,
      thumbnail_url VARCHAR(500),
      duration INTEGER NOT NULL,
      view_count INTEGER DEFAULT 0 NOT NULL,
      like_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Create likes table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      video_id INTEGER NOT NULL REFERENCES videos(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
};

describe('unlikeVideo', () => {
  beforeEach(async () => {
    await resetDB();
    await createTestTables();
  });
  afterEach(resetDB);

  it('should successfully unlike a video', async () => {
    // Create a test user
    const userResult = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ('testuser', 'test@example.com', 'hashedpassword', 'Test User')
      RETURNING id
    `);

    const userId = (userResult.rows[0] as any).id;

    // Create a test video
    const videoResult = await db.execute(sql`
      INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
      VALUES (${userId}, 'Test Video', 'A test video', 'https://example.com/video.mp4', 'https://example.com/thumb.jpg', 300, 0, 1)
      RETURNING id
    `);

    const videoId = (videoResult.rows[0] as any).id;

    // Create a like record
    await db.execute(sql`
      INSERT INTO likes (user_id, video_id)
      VALUES (${userId}, ${videoId})
    `);

    const input: UnlikeVideoInput = {
      user_id: userId,
      video_id: videoId
    };

    // Unlike the video
    const result = await unlikeVideo(input);

    // Should return true for successful unlike
    expect(result).toBe(true);

    // Verify like record was removed
    const remainingLikes = await db.execute(sql`
      SELECT id FROM likes 
      WHERE user_id = ${userId} AND video_id = ${videoId}
    `);

    expect(remainingLikes.rows).toHaveLength(0);

    // Verify video like count was decremented
    const updatedVideo = await db.execute(sql`
      SELECT like_count FROM videos WHERE id = ${videoId}
    `);

    expect((updatedVideo.rows[0] as any).like_count).toBe(0);
  });

  it('should return false when like does not exist', async () => {
    // Create a test user
    const userResult = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ('testuser', 'test@example.com', 'hashedpassword', 'Test User')
      RETURNING id
    `);

    const userId = (userResult.rows[0] as any).id;

    // Create a test video
    const videoResult = await db.execute(sql`
      INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
      VALUES (${userId}, 'Test Video', 'A test video', 'https://example.com/video.mp4', 'https://example.com/thumb.jpg', 300, 0, 0)
      RETURNING id
    `);

    const videoId = (videoResult.rows[0] as any).id;

    const input: UnlikeVideoInput = {
      user_id: userId,
      video_id: videoId
    };

    // Try to unlike when no like exists
    const result = await unlikeVideo(input);

    // Should return false when like doesn't exist
    expect(result).toBe(false);

    // Verify video like count remains unchanged
    const updatedVideo = await db.execute(sql`
      SELECT like_count FROM videos WHERE id = ${videoId}
    `);

    expect((updatedVideo.rows[0] as any).like_count).toBe(0);
  });

  it('should throw error when user does not exist', async () => {
    // Create a test user for the video
    const userResult = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ('testuser', 'test@example.com', 'hashedpassword', 'Test User')
      RETURNING id
    `);

    const userId = (userResult.rows[0] as any).id;

    // Create a test video
    const videoResult = await db.execute(sql`
      INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
      VALUES (${userId}, 'Test Video', 'A test video', 'https://example.com/video.mp4', 'https://example.com/thumb.jpg', 300, 0, 0)
      RETURNING id
    `);

    const videoId = (videoResult.rows[0] as any).id;

    const input: UnlikeVideoInput = {
      user_id: 999, // Non-existent user
      video_id: videoId
    };

    // Should throw error for non-existent user
    await expect(unlikeVideo(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when video does not exist', async () => {
    // Create a test user
    const userResult = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ('testuser', 'test@example.com', 'hashedpassword', 'Test User')
      RETURNING id
    `);

    const userId = (userResult.rows[0] as any).id;

    const input: UnlikeVideoInput = {
      user_id: userId,
      video_id: 999 // Non-existent video
    };

    // Should throw error for non-existent video
    await expect(unlikeVideo(input)).rejects.toThrow(/video not found/i);
  });

  it('should handle multiple likes and only remove specific user like', async () => {
    // Create two test users
    const user1Result = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ('testuser1', 'test1@example.com', 'hashedpassword', 'Test User 1')
      RETURNING id
    `);

    const user2Result = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ('testuser2', 'test2@example.com', 'hashedpassword', 'Test User 2')
      RETURNING id
    `);

    const user1Id = (user1Result.rows[0] as any).id;
    const user2Id = (user2Result.rows[0] as any).id;

    // Create a test video
    const videoResult = await db.execute(sql`
      INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
      VALUES (${user1Id}, 'Test Video', 'A test video', 'https://example.com/video.mp4', 'https://example.com/thumb.jpg', 300, 0, 2)
      RETURNING id
    `);

    const videoId = (videoResult.rows[0] as any).id;

    // Create like records for both users
    await db.execute(sql`
      INSERT INTO likes (user_id, video_id)
      VALUES (${user1Id}, ${videoId}), (${user2Id}, ${videoId})
    `);

    const input: UnlikeVideoInput = {
      user_id: user1Id,
      video_id: videoId
    };

    // Unlike the video for user1
    const result = await unlikeVideo(input);

    expect(result).toBe(true);

    // Verify only user1's like was removed
    const user1Likes = await db.execute(sql`
      SELECT id FROM likes 
      WHERE user_id = ${user1Id} AND video_id = ${videoId}
    `);

    expect(user1Likes.rows).toHaveLength(0);

    // Verify user2's like still exists
    const user2Likes = await db.execute(sql`
      SELECT id FROM likes 
      WHERE user_id = ${user2Id} AND video_id = ${videoId}
    `);

    expect(user2Likes.rows).toHaveLength(1);

    // Verify video like count was decremented by 1
    const updatedVideo = await db.execute(sql`
      SELECT like_count FROM videos WHERE id = ${videoId}
    `);

    expect((updatedVideo.rows[0] as any).like_count).toBe(1);
  });
});