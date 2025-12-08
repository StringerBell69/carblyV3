import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from '@/drizzle/schema';

export const auth = betterAuth({
  trustedOrigins: [process.env.NEXT_PUBLIC_URL || 'http://localhost:3000', 'https://b711baebf896.ngrok-free.app'],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // For MVP, can enable later
    sendResetPassword: async ({ user, url, token }) => {
      const { sendResetPasswordEmail } = await import('./resend');
      await sendResetPasswordEmail({
        to: user.email,
        url,
        token,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  advanced: {
    database: {
      generateId: () => {
        return crypto.randomUUID();
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;


