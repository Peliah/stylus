import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      vendorId: string;
      phone: string;
    } & DefaultSession['user'];
  }

  interface User {
    phone: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    vendorId?: string;
    phone?: string;
  }
}
