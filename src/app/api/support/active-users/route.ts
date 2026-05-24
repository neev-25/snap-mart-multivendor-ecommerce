import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import Order from "@/model/order.model";
import User from "@/model/user.model";
import { NextResponse } from "next/server";

export async function GET() {
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
        const currentUser=await User.findById(session.user.id)
        if(!currentUser)
        {
            return NextResponse.json(
                {message:"User chat not found "},
                {status:400}
            )
        }
        if(currentUser.role==="user")
        {
            const orders=await Order.find({
                buyer:currentUser._id
            }).populate("productVendor","name image shopName role");

            const vendorMap=new Map<string,any>()

            orders.forEach((order:any)=>{
                if(order.productVendor)
                {
                    vendorMap.set(
                        String(order.productVendor._id),
                        order.productVendor
                    );
                }
            });
            return NextResponse.json([...vendorMap.values()])
        }
        if(currentUser.role==="vendor")
        {
            const orders=await Order.find({
                productVendor:currentUser._id
            }).populate("buyer","name image role");

            const buyerMap=new Map<string,any>()

            orders.forEach((order:any)=>{
                if(order.buyer)
                {
                    buyerMap.set(
                        String(order.buyer._id),
                        order.buyer
                    );
                }
            });
            const admin=await User.findOne({role:"admin"}).select("name image role"); 
            return NextResponse.json([admin,...buyerMap.values()])
        }
        if(currentUser.role==="admin")
        {
            const vendors=await User.find({role:"vendor"}).select("name image shopName role");

            return NextResponse.json(vendors);
        }

    } catch (error) {
        return NextResponse.json(
            {message:`failed to get active users for chat ${error}`},
            {status:500}
        )
    }
}