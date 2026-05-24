import { auth } from "@/auth"
import connectDb from "@/lib/connectDB"
import User from "@/model/user.model"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req:NextRequest) {
    try {
        await connectDb()
        const session=await auth()
        if(!session || !session.user?.id || !session.user.email)
        {
            return NextResponse.json(
                {message:"Unauthorized User"},
                {status:400}
            )
        }
        const {withUserId}=await req.json()
        if(!withUserId)
        {
            return NextResponse.json(
                {message:"with user id required"},
                {status:400}
            );
        }
        const user=await User.findById(session.user.id).populate(
            "chats.with",
            "name image role shopName"
        );
        if(!user)
        {
            return NextResponse.json(
                {message:"User is not found"},
                {status:400}
            )
        }
        const chat=user?.chats?.find(
            (c:any)=>String(c.with?._id)===String(withUserId)
        );
        return NextResponse.json(chat?.messages || []);
    }catch(error)
    {
        return NextResponse.json(
            {message:`failed to get chat ${error}`},
            {status:500}
        )

    }
}