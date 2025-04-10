import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Find user in the database
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            include: {
              client: {
                include: {
                  clientType: true
                }
              }
            }
          });

          if (!user) {
            console.log('User not found:', credentials.username);
            return null;
          }

          // Verify password
          const isValid = await verifyPassword(credentials.password, user.password);
          
          if (!isValid) {
            console.log('Invalid password for user:', credentials.username);
            return null;
          }

          // Return the user object (excluding password)
          return {
            id: user.id.toString(),
            name: user.client?.name || user.username,
            email: user.email,
            role: user.role,
            clientId: user.client?.id.toString() || null,
            clientSlug: user.client?.slug || null,
            clientName: user.client?.name || null,
            clientType: user.client?.clientType?.name || null,
          };
        } catch (error) {
          console.error('Error during authorization:', error);
          return null;
        } finally {
          await prisma.$disconnect();
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to the token
      if (user) {
        token.role = user.role;
        token.clientId = user.clientId;
        token.clientSlug = user.clientSlug;
        token.clientName = user.clientName;
        token.clientType = user.clientType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.clientId = token.clientId as string | null;
        session.user.clientSlug = token.clientSlug as string | null;
        session.user.clientName = token.clientName as string | null;
        session.user.clientType = token.clientType as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
