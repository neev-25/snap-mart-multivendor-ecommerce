import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET(){
    try {
        await connectDb()
        const vendors=await User.find({role:"vendor"}).sort({createdAt:-1}).populate("vendorProducts")
        if(!vendors)
        {
            return NextResponse.json({message:"Vendors is not found"},{status:400})
        }
        return NextResponse.json({vendors},{status:200})
    } catch (error) {
        return NextResponse.json({message:`get all vendors error ${error}`},{status:500})
    }
}