import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'online',
        },
      },
    })
  );
}

providers.push(
  CredentialsProvider({
    name: 'DevLogin',
    credentials: {
      email: { label: 'Email', type: 'text' },
      name: { label: 'Name', type: 'text' },
      picture: { label: 'Picture', type: 'text' },
      role: { label: 'Role', type: 'text' },
    },
    async authorize(credentials) {
      const enableDev = process.env.ENABLE_DEV_LOGIN === 'true' || process.env.NODE_ENV !== 'production';
      if (!enableDev) return null;
      const email = (credentials?.email as string) || 'demo@local.test';
      const name = (credentials?.name as string) || 'Demo User';
      const picture = (credentials?.picture as string) || 'https://i.pravatar.cc/120?img=5';
      const role = (credentials?.role as string) || 'user';
      return { id: email, email, name, image: picture, role } as any;
    },
  })
);

export const authOptions = {
  providers,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
  callbacks: {
    async jwt({ token, user, profile }: any) {
      if (user) {
        token.name = user.name;
        token.email = (user as any).email ?? token.email;
        (token as any).picture = (user as any).image ?? (profile as any)?.picture ?? (token as any).picture;
        (token as any).role = (user as any).role ?? (token as any).role ?? 'user';
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
        (session.user as any).image = (token as any).picture;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
} as const;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


