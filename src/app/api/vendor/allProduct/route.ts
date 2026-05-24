import connectDb from "@/lib/connectDB";
import Product from "@/model/product.model";
import { NextResponse } from "next/server";

export async function GET(){
    try {
        await connectDb()
        const products=await Product.find().populate("vendor","name email shopName").populate({
            path:"reviews.user",select:"name email image"
        }).sort({createdAt:-1})

        return NextResponse.json(products,{status:201})
    } catch (error) {
        return NextResponse.json({message:`failed to getAll Products ${error}`},{status:500})
    }
}