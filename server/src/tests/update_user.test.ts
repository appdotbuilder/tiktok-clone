import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';

describe('updateUser', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
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

    // Create a test user
    const result = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name, bio, avatar_url)
      VALUES ('testuser', 'test@example.com', 'hashed_password', 'Test User', 'Original bio', 'https://example.com/avatar.jpg')
      RETURNING id
    `);

    testUserId = (result.rows[0] as any)['id'];
  });

  afterEach(resetDB);

  it('should update display_name', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: 'Updated Display Name'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toEqual('Updated Display Name');
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.bio).toEqual('Original bio'); // Should remain unchanged
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update bio', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      bio: 'Updated bio content'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.bio).toEqual('Updated bio content');
    expect(result.display_name).toEqual('Test User'); // Should remain unchanged
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update avatar_url', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      avatar_url: 'https://example.com/new-avatar.jpg'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.display_name).toEqual('Test User'); // Should remain unchanged
    expect(result.bio).toEqual('Original bio'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: 'New Display Name',
      bio: 'New bio content',
      avatar_url: 'https://example.com/new-avatar.jpg'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toEqual('New Display Name');
    expect(result.bio).toEqual('New bio content');
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.username).toEqual('testuser'); // Should remain unchanged
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set fields to null when provided', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: null,
      bio: null,
      avatar_url: null
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.username).toEqual('testuser'); // Should remain unchanged
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: 'Database Test Name',
      bio: 'Database test bio'
    };

    await updateUser(updateInput);

    // Verify changes persisted in database
    const users = await db.execute(
      sql`SELECT * FROM users WHERE id = ${testUserId}`
    );

    expect(users.rows).toHaveLength(1);
    const user = users.rows[0] as any;
    expect(user['display_name']).toEqual('Database Test Name');
    expect(user['bio']).toEqual('Database test bio');
    expect(user['avatar_url']).toEqual('https://example.com/avatar.jpg'); // Should remain unchanged
    expect(new Date(user['updated_at'])).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalUser = await db.execute(
      sql`SELECT updated_at FROM users WHERE id = ${testUserId}`
    );
    
    const originalUpdatedAt = new Date((originalUser.rows[0] as any)['updated_at']);

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: 'Timestamp Test'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 999999, // Non-existent ID
      display_name: 'Should not work'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/user not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Update only display_name
    const updateInput1: UpdateUserInput = {
      id: testUserId,
      display_name: 'First Update'
    };

    await updateUser(updateInput1);

    // Update only bio (display_name should remain from previous update)
    const updateInput2: UpdateUserInput = {
      id: testUserId,
      bio: 'Second Update Bio'
    };

    const result = await updateUser(updateInput2);

    expect(result.display_name).toEqual('First Update');
    expect(result.bio).toEqual('Second Update Bio');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg'); // Original value
  });
});