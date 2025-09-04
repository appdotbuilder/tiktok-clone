import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { sql } from 'drizzle-orm';

// Simple hash function to match handler implementation
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const createTestSchema = async () => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(100),
      bio TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `);
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      duration INTEGER NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `);
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      video_id INTEGER NOT NULL REFERENCES videos(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )
  `);
};

const testInput: RegisterUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  display_name: 'Test User'
};

describe('registerUser', () => {
  beforeEach(async () => {
    await createDB();
    await createTestSchema();
  });
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await registerUser(testInput);

    // Verify returned user data
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.display_name).toEqual('Test User');
    expect(result.bio).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify password is hashed
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(50);
  });

  it('should save user to database correctly', async () => {
    const result = await registerUser(testInput);

    // Query database directly
    const users = await db.execute(sql`
      SELECT * FROM users WHERE id = ${result.id}
    `);

    expect(users.rows).toHaveLength(1);
    const dbUser = users.rows[0] as any;
    expect(dbUser['username']).toEqual('testuser');
    expect(dbUser['email']).toEqual('test@example.com');
    expect(dbUser['display_name']).toEqual('Test User');
    expect(new Date(dbUser['created_at'])).toBeInstanceOf(Date);
  });

  it('should hash password correctly', async () => {
    const result = await registerUser(testInput);

    // Verify password hash matches expected hash
    const expectedHash = await hashPassword('password123');
    expect(result.password_hash).toEqual(expectedHash);

    // Verify different password produces different hash
    const differentHash = await hashPassword('wrongpassword');
    expect(result.password_hash).not.toEqual(differentHash);
  });

  it('should register user with minimal data (no display_name)', async () => {
    const minimalInput: RegisterUserInput = {
      username: 'minimaluser',
      email: 'minimal@example.com',
      password: 'password123'
    };

    const result = await registerUser(minimalInput);

    expect(result.username).toEqual('minimaluser');
    expect(result.email).toEqual('minimal@example.com');
    expect(result.display_name).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should register user with null display_name', async () => {
    const inputWithNullDisplayName: RegisterUserInput = {
      username: 'nulluser',
      email: 'null@example.com',
      password: 'password123',
      display_name: null
    };

    const result = await registerUser(inputWithNullDisplayName);

    expect(result.username).toEqual('nulluser');
    expect(result.display_name).toBeNull();
  });

  it('should reject duplicate username', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register another user with same username but different email
    const duplicateUsernameInput: RegisterUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com', // Different email
      password: 'password123',
      display_name: 'Different User'
    };

    await expect(registerUser(duplicateUsernameInput)).rejects.toThrow(/username already exists/i);
  });

  it('should reject duplicate email', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register another user with same email but different username
    const duplicateEmailInput: RegisterUserInput = {
      username: 'differentuser', // Different username
      email: 'test@example.com', // Same email
      password: 'password123',
      display_name: 'Different User'
    };

    await expect(registerUser(duplicateEmailInput)).rejects.toThrow(/email already exists/i);
  });

  it('should allow multiple users with different usernames and emails', async () => {
    // Register first user
    const user1 = await registerUser(testInput);

    // Register second user with different credentials
    const secondInput: RegisterUserInput = {
      username: 'seconduser',
      email: 'second@example.com',
      password: 'password456',
      display_name: 'Second User'
    };

    const user2 = await registerUser(secondInput);

    // Verify both users exist and are different
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.username).toEqual('testuser');
    expect(user2.username).toEqual('seconduser');
    expect(user1.email).toEqual('test@example.com');
    expect(user2.email).toEqual('second@example.com');

    // Verify both exist in database
    const allUsers = await db.execute(sql`SELECT * FROM users`);
    expect(allUsers.rows).toHaveLength(2);
  });

  it('should handle case sensitivity correctly', async () => {
    // Register user with lowercase username
    await registerUser(testInput);

    // Try to register with different case - should be allowed (case-sensitive)
    const caseVariantInput: RegisterUserInput = {
      username: 'TestUser', // Different case
      email: 'different@example.com',
      password: 'password123'
    };

    const result = await registerUser(caseVariantInput);
    expect(result.username).toEqual('TestUser');
    
    // Verify both users exist
    const allUsers = await db.execute(sql`SELECT * FROM users`);
    expect(allUsers.rows).toHaveLength(2);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeTime = new Date();
    const result = await registerUser(testInput);
    const afterTime = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
  });
});