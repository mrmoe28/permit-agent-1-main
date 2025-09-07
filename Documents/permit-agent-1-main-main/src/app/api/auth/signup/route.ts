import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withDatabase } from '@/lib/database/db';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await withDatabase(async (client) => {
      const result = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await withDatabase(async (client) => {
      const result = await client.query(
        `INSERT INTO users (email, name, password_hash, email_verified)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, created_at`,
        [email, name, passwordHash, true] // Auto-verify for now
      );
      return result.rows[0];
    });

    // Create default free subscription
    await withDatabase(async (client) => {
      await client.query(
        `INSERT INTO subscriptions (user_id, stripe_customer_id, plan_type, status, usage_limit)
         VALUES ($1, $2, 'free', 'active', 3)`,
        [newUser.id, `temp_${newUser.id}`]
      );
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
