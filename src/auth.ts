import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import connectDb from "./lib/connectDB";
import User from "./model/user.model";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";

if (!process.env.AUTH_SECRET) {
  console.error("[auth] AUTH_SECRET is missing in .env.local — sign-in sessions will fail.");
}
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email",type:"email" },
        password: { label: "Password", type: "password" },
      },
     async authorize(credentials){
        try {
        await connectDb()
        const email=credentials.email as string
        const password=credentials.password as string

        const user=await User.findOne({email})
        if(!user)
        {
            throw new Error("User not found")
        }
        if(!user.password)
        {
            throw new Error("Use Google sign-in for this account")
        }
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch)
        {
            throw new Error("Incorrect Password")
        }
        return {
            id:user._id.toString(),
            email:user.email,
            name:user.name,
            role:user.role,
        }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg.includes("MONGODB") || msg.includes("querySrv") || msg.includes("ECONNREFUSED")) {
            throw new Error("Database connection failed. Check MONGODB_URL in .env.local and restart the dev server.");
          }
          if (msg.includes("buffering timed out")) {
            throw new Error("Database unreachable. Restart dev server after fixing .env.local.");
          }
          throw error;
        }

     }

     
}),
Google({
  clientId:process.env.AUTH_GOOGLE_ID,
  clientSecret:process.env.AUTH_GOOGLE_SECRET
})
  ],
  callbacks:{
    async signIn({user,account})
    {
      if(account?.provider=="google")
      {
        await connectDb()
        let DBUser=await User.findOne({email:user.email})
        if(!DBUser)
        {
          DBUser=await User.create({
            name:user.name,
            email:user.email,
            image:user.image,
            cart:[],
            orders:[],
            wishlist:[],
          })
        }   
        user.id=DBUser._id.toString()
        user.role = DBUser.role?.toString() || "user";

      }
      return true
    },
    jwt({token,user,trigger,session})
    {
        if(user)
        {
            token.id=user.id,
            token.email=user.email,
            token.name=user.name,
            token.role=user.role
        }
        if (trigger === "update" && session?.role) {
            token.role = session.role as string;
        }
        return token
    },
    session({session,token}){
        if(session.user)
        {
            session.user.id=token.id as string,
            session.user.email=token.email as string,
            session.user.name=token.name as string,
            session.user.role=token.role as string
        }
        return session

    }
  },
  pages:{
    signIn:"/login",
    error:"/login"
  },
  session:{
    strategy:"jwt",
    maxAge:10*24*60*60
  },
  secret:process.env.AUTH_SECRET
})