import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import authConfig from '@/auth.config';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.sub === 'string') {
        session.user.id = typeof token.id === 'string' ? token.id : token.sub;
      }

      return session;
    }
  }
});
