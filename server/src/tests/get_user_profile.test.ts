import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { getUserProfile } from '../handlers/get_user_profile';
import { sql } from 'drizzle-orm';

describe('getUserProfile', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create tables manually since schema is empty
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name VARCHAR(100),
        bio TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE videos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration INTEGER NOT NULL,
        view_count INTEGER NOT NULL DEFAULT 0,
        like_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  });
  afterEach(resetDB);

  it('should return user profile with videos', async () => {
    // Create test user using raw SQL
    const userResult = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name, bio, avatar_url, created_at, updated_at)
      VALUES ('testuser', 'test@example.com', 'hashedpassword123', 'Test User', 'This is a test bio', 'https://example.com/avatar.jpg', NOW(), NOW())
      RETURNING id
    `);

    const userId = (userResult.rows[0] as any)['id'] as number;

    // Create test videos for the user using raw SQL
    await db.execute(sql`
      INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count, created_at, updated_at)
      VALUES 
        (${userId}, 'First Video', 'My first video', 'https://example.com/video1.mp4', 'https://example.com/thumb1.jpg', 120, 100, 10, NOW(), NOW()),
        (${userId}, 'Second Video', 'My second video', 'https://example.com/video2.mp4', 'https://example.com/thumb2.jpg', 180, 200, 25, NOW(), NOW())
    `);

    const result = await getUserProfile(userId);

    // Verify user profile data
    expect(result).toBeDefined();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual('testuser');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.display_name).toEqual('Test User');
    expect(result!.bio).toEqual('This is a test bio');
    expect(result!.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify videos array
    expect(result!.videos).toHaveLength(2);
    
    const firstVideo = result!.videos.find(v => v.title === 'First Video');
    expect(firstVideo).toBeDefined();
    expect(firstVideo!.user_id).toEqual(userId);
    expect(firstVideo!.description).toEqual('My first video');
    expect(firstVideo!.video_url).toEqual('https://example.com/video1.mp4');
    expect(firstVideo!.duration).toEqual(120);
    expect(firstVideo!.view_count).toEqual(100);
    expect(firstVideo!.like_count).toEqual(10);
    expect(firstVideo!.created_at).toBeInstanceOf(Date);

    const secondVideo = result!.videos.find(v => v.title === 'Second Video');
    expect(secondVideo).toBeDefined();
    expect(secondVideo!.user_id).toEqual(userId);
    expect(secondVideo!.duration).toEqual(180);
    expect(secondVideo!.view_count).toEqual(200);
    expect(secondVideo!.like_count).toEqual(25);
  });

  it('should return user profile with empty videos array when user has no videos', async () => {
    // Create test user without videos using raw SQL
    const userResult = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name, bio, avatar_url, created_at, updated_at)
      VALUES ('novideouser', 'novideo@example.com', 'hashedpassword123', 'No Video User', NULL, NULL, NOW(), NOW())
      RETURNING id
    `);

    const userId = (userResult.rows[0] as any)['id'] as number;

    const result = await getUserProfile(userId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual('novideouser');
    expect(result!.email).toEqual('novideo@example.com');
    expect(result!.display_name).toEqual('No Video User');
    expect(result!.bio).toBeNull();
    expect(result!.avatar_url).toBeNull();
    expect(result!.videos).toHaveLength(0);
  });

  it('should return null when user does not exist', async () => {
    const result = await getUserProfile(99999);
    expect(result).toBeNull();
  });

  it('should handle user with nullable fields correctly', async () => {
    // Create user with minimal data (nullable fields as null) using raw SQL
    const userResult = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name, bio, avatar_url, created_at, updated_at)
      VALUES ('minimaluser', 'minimal@example.com', 'hashedpassword123', NULL, NULL, NULL, NOW(), NOW())
      RETURNING id
    `);

    const userId = (userResult.rows[0] as any)['id'] as number;

    const result = await getUserProfile(userId);

    expect(result).toBeDefined();
    expect(result!.display_name).toBeNull();
    expect(result!.bio).toBeNull();
    expect(result!.avatar_url).toBeNull();
    expect(result!.videos).toHaveLength(0);
  });
});