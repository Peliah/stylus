import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyLoginOtp } from './auth-otp';
import { prisma } from './prisma';
import { getPendingSetup } from './setup-session';
import { consumeSetup } from './setup-service';
import { getVendorWhatsAppStatus } from './whatsapp-connection';
import { normalizeWhatsAppPhone, whatsAppPhoneVariants } from './phone';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'whatsapp-linked',
      name: 'WhatsApp Linked',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone) return null;

        const phone = normalizeWhatsAppPhone(credentials.phone);
        const variants = whatsAppPhoneVariants(credentials.phone);
        const vendor = await prisma.vendor.findFirst({
          where: { phoneNumber: { in: variants.length ? variants : [phone] } },
        });
        if (!vendor) return null;

        const status = await getVendorWhatsAppStatus(credentials.phone);
        if (!status.connected) return null;

        return {
          id: vendor.id,
          name: vendor.name,
          phone: vendor.phoneNumber,
        };
      },
    }),
    CredentialsProvider({
      id: 'whatsapp-otp',
      name: 'WhatsApp OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        code: { label: 'Code', type: 'text' },
        shopName: { label: 'Shop name', type: 'text' },
        intent: { label: 'Intent', type: 'text' },
        setupId: { label: 'Setup ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.code) {
          return null;
        }

        // New vendor signup via /get-started setup flow
        if (credentials.setupId) {
          const setup = await getPendingSetup(credentials.setupId);
          if (!setup?.connectedPhone) return null;

          let phone: string;
          try {
            phone = await verifyLoginOtp(setup.connectedPhone, credentials.code);
          } catch {
            return null;
          }

          const existing = await prisma.vendor.findUnique({ where: { phoneNumber: phone } });
          if (existing) return null;

          const vendor = await prisma.vendor.create({
            data: {
              name: setup.shopName?.trim() || 'My Shop',
              phoneNumber: phone,
              openwaSessionId: setup.openwaSessionId,
              whatsappLinkedAt: new Date(),
              onboardingComplete: false,
            },
          });

          await consumeSetup(credentials.setupId);

          return {
            id: vendor.id,
            name: vendor.name,
            phone: vendor.phoneNumber,
          };
        }

        if (!credentials.phone) {
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
              onboardingComplete: false,
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
