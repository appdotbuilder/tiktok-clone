import { db } from '../db';
import { sql } from 'drizzle-orm';
import { type UpdateUserInput, type User } from '../schema';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // First check if user exists
    const existingUsersResult = await db.execute(
      sql`SELECT * FROM users WHERE id = ${input.id}`
    );

    if (existingUsersResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Build update query using template literals with direct substitution
    let updateQuery = 'UPDATE users SET updated_at = NOW()';
    
    if (input.display_name !== undefined) {
      updateQuery += `, display_name = ${input.display_name === null ? 'NULL' : `'${input.display_name?.replace(/'/g, "''")}'`}`;
    }

    if (input.bio !== undefined) {
      updateQuery += `, bio = ${input.bio === null ? 'NULL' : `'${input.bio?.replace(/'/g, "''")}'`}`;
    }

    if (input.avatar_url !== undefined) {
      updateQuery += `, avatar_url = ${input.avatar_url === null ? 'NULL' : `'${input.avatar_url?.replace(/'/g, "''")}'`}`;
    }

    updateQuery += ` WHERE id = ${input.id} RETURNING *`;

    const result = await db.execute(sql.raw(updateQuery));

    const updatedUser = result.rows[0] as any;
    
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      password_hash: updatedUser.password_hash,
      display_name: updatedUser.display_name,
      bio: updatedUser.bio,
      avatar_url: updatedUser.avatar_url,
      created_at: new Date(updatedUser.created_at),
      updated_at: new Date(updatedUser.updated_at)
    };
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};