import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyLoginOtp } from './auth-otp';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'whatsapp-otp',
      name: 'WhatsApp OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        code: { label: 'Code', type: 'text' },
        shopName: { label: 'Shop name', type: 'text' },
        intent: { label: 'Intent', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null;
        }

        let phone: string;
        try {
          phone = await verifyLoginOtp(credentials.phone, credentials.code);
        } catch {
          return null;
        }

        const intent = credentials.intent ?? 'login';

        let vendor = await prisma.vendor.findUnique({
          where: { phoneNumber: phone },
        });

        if (!vendor && intent === 'signup') {
          const shopName = credentials.shopName?.trim() || 'My Shop';
          vendor = await prisma.vendor.create({
            data: {
              name: shopName,
              phoneNumber: phone,
            },
          });
        }

        if (!vendor) {
          return null;
        }

        return {
          id: vendor.id,
          name: vendor.name,
          phone: vendor.phoneNumber,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.vendorId = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.vendorId = token.vendorId as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
