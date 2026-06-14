import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  trustHost: true,
  providers,
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
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
    },
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isAppRoute =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/calendar');

      if (isAppRoute) {
        return isLoggedIn;
      }

      return true;
    }
  }
});
