import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { type UpdateVideoInput } from '../schema';
import { updateVideo } from '../handlers/update_video';
import { sql } from 'drizzle-orm';

// Helper function to create tables for testing
async function createTestTables() {
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
}

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  display_name: 'Test User'
};

// Test video data
const testVideo = {
  title: 'Original Video Title',
  description: 'Original video description',
  video_url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumb.jpg',
  duration: 120
};

describe('updateVideo', () => {
  beforeEach(async () => {
    await createDB();
    await createTestTables();
  });
  afterEach(resetDB);

  it('should update video title', async () => {
    // Create test user using raw SQL
    const userResult = await db.execute(
      sql`INSERT INTO users (username, email, password_hash, display_name) 
          VALUES (${testUser.username}, ${testUser.email}, ${testUser.password_hash}, ${testUser.display_name}) 
          RETURNING id`
    );
    
    const userId = (userResult.rows[0] as any).id;

    // Create test video using raw SQL
    const videoResult = await db.execute(
      sql`INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count) 
          VALUES (${userId}, ${testVideo.title}, ${testVideo.description}, ${testVideo.video_url}, ${testVideo.thumbnail_url}, ${testVideo.duration}, 0, 0) 
          RETURNING id`
    );

    const videoId = (videoResult.rows[0] as any).id;

    // Update video title
    const updateInput: UpdateVideoInput = {
      id: videoId,
      title: 'Updated Video Title'
    };

    const result = await updateVideo(updateInput);

    // Verify updated title
    expect(result.title).toEqual('Updated Video Title');
    expect(result.description).toEqual(testVideo.description); // Should remain unchanged
    expect(result.id).toEqual(videoId);
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update video description', async () => {
    // Create test user
    const userResult = await db.execute(
      sql`INSERT INTO users (username, email, password_hash, display_name) 
          VALUES (${testUser.username}, ${testUser.email}, ${testUser.password_hash}, ${testUser.display_name}) 
          RETURNING id`
    );
    
    const userId = (userResult.rows[0] as any).id;

    // Create test video
    const videoResult = await db.execute(
      sql`INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count) 
          VALUES (${userId}, ${testVideo.title}, ${testVideo.description}, ${testVideo.video_url}, ${testVideo.thumbnail_url}, ${testVideo.duration}, 0, 0) 
          RETURNING id`
    );

    const videoId = (videoResult.rows[0] as any).id;

    // Update video description
    const updateInput: UpdateVideoInput = {
      id: videoId,
      description: 'Updated video description'
    };

    const result = await updateVideo(updateInput);

    // Verify updated description
    expect(result.description).toEqual('Updated video description');
    expect(result.title).toEqual(testVideo.title); // Should remain unchanged
    expect(result.id).toEqual(videoId);
    expect(result.user_id).toEqual(userId);
  });

  it('should update both title and description', async () => {
    // Create test user
    const userResult = await db.execute(
      sql`INSERT INTO users (username, email, password_hash, display_name) 
          VALUES (${testUser.username}, ${testUser.email}, ${testUser.password_hash}, ${testUser.display_name}) 
          RETURNING id`
    );
    
    const userId = (userResult.rows[0] as any).id;

    // Create test video
    const videoResult = await db.execute(
      sql`INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count) 
          VALUES (${userId}, ${testVideo.title}, ${testVideo.description}, ${testVideo.video_url}, ${testVideo.thumbnail_url}, ${testVideo.duration}, 0, 0) 
          RETURNING id`
    );

    const videoId = (videoResult.rows[0] as any).id;

    // Update both title and description
    const updateInput: UpdateVideoInput = {
      id: videoId,
      title: 'New Title',
      description: 'New description'
    };

    const result = await updateVideo(updateInput);

    // Verify both fields updated
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.id).toEqual(videoId);
    expect(result.user_id).toEqual(userId);
  });

  it('should set description to null when explicitly provided', async () => {
    // Create test user
    const userResult = await db.execute(
      sql`INSERT INTO users (username, email, password_hash, display_name) 
          VALUES (${testUser.username}, ${testUser.email}, ${testUser.password_hash}, ${testUser.display_name}) 
          RETURNING id`
    );
    
    const userId = (userResult.rows[0] as any).id;

    // Create test video with description
    const videoResult = await db.execute(
      sql`INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count) 
          VALUES (${userId}, ${testVideo.title}, ${testVideo.description}, ${testVideo.video_url}, ${testVideo.thumbnail_url}, ${testVideo.duration}, 0, 0) 
          RETURNING id`
    );

    const videoId = (videoResult.rows[0] as any).id;

    // Update description to null
    const updateInput: UpdateVideoInput = {
      id: videoId,
      description: null
    };

    const result = await updateVideo(updateInput);

    // Verify description is null
    expect(result.description).toBeNull();
    expect(result.title).toEqual(testVideo.title); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    // Create test user
    const userResult = await db.execute(
      sql`INSERT INTO users (username, email, password_hash, display_name) 
          VALUES (${testUser.username}, ${testUser.email}, ${testUser.password_hash}, ${testUser.display_name}) 
          RETURNING id`
    );
    
    const userId = (userResult.rows[0] as any).id;

    // Create test video
    const videoResult = await db.execute(
      sql`INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count) 
          VALUES (${userId}, ${testVideo.title}, ${testVideo.description}, ${testVideo.video_url}, ${testVideo.thumbnail_url}, ${testVideo.duration}, 0, 0) 
          RETURNING id`
    );

    const videoId = (videoResult.rows[0] as any).id;

    // Update video
    const updateInput: UpdateVideoInput = {
      id: videoId,
      title: 'Database Test Title',
      description: 'Database test description'
    };

    await updateVideo(updateInput);

    // Query database directly to verify changes
    const videos = await db.execute(
      sql`SELECT * FROM videos WHERE id = ${videoId}`
    );

    expect(videos.rows).toHaveLength(1);
    const video = videos.rows[0] as any;
    expect(video.title).toEqual('Database Test Title');
    expect(video.description).toEqual('Database test description');
    expect(video.updated_at).toBeDefined();
  });

  it('should throw error when video not found', async () => {
    const updateInput: UpdateVideoInput = {
      id: 99999, // Non-existent video ID
      title: 'New Title'
    };

    expect(updateVideo(updateInput)).rejects.toThrow(/video not found/i);
  });

  it('should only update provided fields', async () => {
    // Create test user
    const userResult = await db.execute(
      sql`INSERT INTO users (username, email, password_hash, display_name) 
          VALUES (${testUser.username}, ${testUser.email}, ${testUser.password_hash}, ${testUser.display_name}) 
          RETURNING id`
    );
    
    const userId = (userResult.rows[0] as any).id;

    // Create test video
    const videoResult = await db.execute(
      sql`INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count) 
          VALUES (${userId}, ${testVideo.title}, ${testVideo.description}, ${testVideo.video_url}, ${testVideo.thumbnail_url}, ${testVideo.duration}, 0, 0) 
          RETURNING *`
    );

    const videoId = (videoResult.rows[0] as any).id;
    const originalCreatedAt = new Date((videoResult.rows[0] as any).created_at);

    // Update only title (description should remain unchanged)
    const updateInput: UpdateVideoInput = {
      id: videoId,
      title: 'Only Title Updated'
    };

    const result = await updateVideo(updateInput);

    // Verify only title changed
    expect(result.title).toEqual('Only Title Updated');
    expect(result.description).toEqual(testVideo.description);
    expect(result.created_at).toEqual(originalCreatedAt); // Should not change
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalCreatedAt).toBe(true);
  });
});