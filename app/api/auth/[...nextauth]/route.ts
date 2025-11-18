import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const providers = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'text' },
      name: { label: 'Name', type: 'text' },
      token: { label: 'Token', type: 'text' },
      userInfo: { label: 'UserInfo', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;
      
      const email = credentials.email;
      const name = credentials.name || 'User';
      const token = credentials.token;
      
      let userInfo: any = {};
      try {
        if (credentials.userInfo) {
          userInfo = JSON.parse(credentials.userInfo);
        }
      } catch {}
      
      return { 
        id: email, 
        email, 
        name, 
        image: userInfo.avatar || 'https://www.nncsgo.com/storage/user.png',
        token,
        userInfo,
      } as any;
    },
  })
];

export const authOptions = {
  providers,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.name = user.name;
        token.email = (user as any).email ?? token.email;
        (token as any).picture = (user as any).image;
        (token as any).accessToken = (user as any).token;
        (token as any).userInfo = (user as any).userInfo;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
        (session.user as any).image = (token as any).picture;
        (session.user as any).accessToken = (token as any).accessToken;
        (session.user as any).userInfo = (token as any).userInfo;
      }
      return session;
    },
  },
} as const;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
