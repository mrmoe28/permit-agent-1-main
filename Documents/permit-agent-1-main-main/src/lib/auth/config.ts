import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { withDatabase } from '../database/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await withDatabase(async (client) => {
            const result = await client.query(
              'SELECT id, email, name, password_hash, role, is_active FROM users WHERE email = $1',
              [credentials.email]
            );
            return result.rows[0];
          });

          if (!user || !user.is_active) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isPasswordValid) {
            return null;
          }

          // Update last login
          await withDatabase(async (client) => {
            await client.query(
              'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
              [user.id]
            );
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists or create new user
          const existingUser = await withDatabase(async (client) => {
            const result = await client.query(
              'SELECT id, email, name, role, is_active FROM users WHERE email = $1',
              [user.email]
            );
            return result.rows[0];
          });

          if (!existingUser) {
            // Create new user from Google OAuth
            await withDatabase(async (client) => {
              await client.query(
                `INSERT INTO users (email, name, role, is_active, created_at, updated_at, last_login) 
                 VALUES ($1, $2, 'user', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [user.email, user.name]
              );
            });
          } else if (!existingUser.is_active) {
            // Don't allow sign in if account is deactivated
            return false;
          } else {
            // Update last login for existing user
            await withDatabase(async (client) => {
              await client.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [existingUser.id]
              );
            });
          }
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Get user data from database for each session
        try {
          const userData = await withDatabase(async (client) => {
            const result = await client.query(
              'SELECT id, email, name, role FROM users WHERE email = $1',
              [session.user.email]
            );
            return result.rows[0];
          });

          if (userData) {
            session.user.id = userData.id;
            session.user.role = userData.role;
          }
        } catch (error) {
          console.error('Session callback error:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
