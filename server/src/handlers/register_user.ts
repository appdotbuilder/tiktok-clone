import { db } from '../db';
import { type RegisterUserInput, type User } from '../schema';
import { sql } from 'drizzle-orm';

// Simple hash function for demonstration (in production, use bcrypt)
const hashPassword = async (password: string): Promise<string> => {
  // Simple hash for testing - in production use bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const registerUser = async (input: RegisterUserInput): Promise<User> => {
  try {
    // Check if user already exists with the same username or email
    const existingUsers = await db.execute(sql`
      SELECT id, username, email 
      FROM users 
      WHERE username = ${input.username} OR email = ${input.email}
    `);

    if (existingUsers.rows.length > 0) {
      const existingUser = existingUsers.rows[0] as any;
      if (existingUser['username'] === input.username) {
        throw new Error('Username already exists');
      }
      if (existingUser['email'] === input.email) {
        throw new Error('Email already exists');
      }
    }

    // Hash the password
    const password_hash = await hashPassword(input.password);

    // Insert user record
    const result = await db.execute(sql`
      INSERT INTO users (username, email, password_hash, display_name, created_at, updated_at)
      VALUES (${input.username}, ${input.email}, ${password_hash}, ${input.display_name || null}, NOW(), NOW())
      RETURNING *
    `);

    const user = result.rows[0] as any;
    return {
      id: user['id'],
      username: user['username'],
      email: user['email'],
      password_hash: user['password_hash'],
      display_name: user['display_name'],
      bio: user['bio'],
      avatar_url: user['avatar_url'],
      created_at: new Date(user['created_at']),
      updated_at: new Date(user['updated_at'])
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};