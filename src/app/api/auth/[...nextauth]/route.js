import CredentialsProvider from "next-auth/providers/credentials"
import NextAuth from "next-auth/next"
import { connectDB } from "@/dbConfig/dbConfig"
import bcrypt from "bcryptjs"
import Trader from "@/models/trader.model"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }
        
        await connectDB();
        
        try {
          console.log(`NextAuth: Login attempt for email: ${credentials.email}`);
          
          // Find trader by email
          const trader = await Trader.findOne({ email: credentials.email });
          
          if (!trader) {
            console.log(`NextAuth: No trader found with email: ${credentials.email}`);
            throw new Error("No trader account found with this email");
          }
          
          // Log the entire trader object for debugging
          console.log('NextAuth: Trader object:', JSON.stringify(trader, null, 2));
          console.log(`NextAuth: Trader found: ${trader.name}, isVerified: ${trader.isVerified}`);
          
          // Skip verification check for now to simplify testing
          // if (!user.isVerified) {
          //   throw new Error("Email not verified. Please verify your email first.");
          // }

          // Direct comparison for passwords
          console.log(`NextAuth: Comparing passwords`);
          console.log(`NextAuth: Password from credentials: ${credentials.password}`);
          console.log(`NextAuth: Stored password in DB: ${trader.password}`);
          
          const inputPassword = String(credentials.password);
          const storedPassword = String(trader.password || '');
          
          // Direct comparison for passwords
          if (inputPassword !== storedPassword) {
            console.log(`NextAuth: Invalid password for trader: ${trader.email}`);
            throw new Error("Invalid password");
          }
          
          console.log(`NextAuth: Password match successful`);
          
          // Check if trader has the correct role
          if (trader.role !== 'trader') {
            console.log(`NextAuth: Account ${trader.email} is not a trader (role: ${trader.role})`);
            throw new Error("Access denied. Only traders can login to this platform.");
          }
          
          console.log(`NextAuth: Login successful for trader: ${trader.email}`);
          
          // Ensure profitGenerated and totalTrades are set if they don't exist
          if (trader.profitGenerated === undefined) {
            trader.profitGenerated = 0;
            await trader.save();
          }
          
          if (trader.totalTrades === undefined) {
            trader.totalTrades = 0;
            await trader.save();
          }
          
          // Return trader data
          return {
            id: trader._id.toString(),
            email: trader.email,
            name: trader.name,
            isVerified: trader.isVerified || true,
            role: 'trader', // Always trader role
            phone: trader.phone || ''
          };
        } catch (error) {
          console.log("NextAuth authorize error:", error);
          throw new Error(error.message);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isVerified = user.isVerified;
        token.name = user.name;
        token.email = user.email;
        token.role = 'trader';
        token.phone = user.phone || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          isVerified: token.isVerified,
          name: token.name,
          email: token.email,
          role: token.role,
          phone: token.phone || ''
        };
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }