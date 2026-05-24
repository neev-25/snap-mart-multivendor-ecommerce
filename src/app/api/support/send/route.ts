import { auth } from "@/auth";
import connectDb from "@/lib/connectDB";
import { NextRequest, NextResponse } from "next/server";
import mongoose from 'mongoose';
import User from "@/model/user.model";

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
        const senderId=session.user.id
        const {receiverId,text}=await req.json()
        if(!receiverId || !text)
        {
            return NextResponse.json(
                {message:"receriverId and text-required"},
                {status:400}
            );
        }
        const senderObjectId=new mongoose.Types.ObjectId(senderId);
        const receiverObjectId=new mongoose.Types.ObjectId(receiverId);
        //save in sender
        await User.updateOne(
            {
                _id:senderObjectId,
                "chats.with":receiverObjectId,
            },
            {
                $push:{
                    "chats.$.messages":{
                        sender:senderObjectId,
                        text,
                        createdAt:new Date(),
                    },
                },
            },
        );

        const senderHashChat=await User.findOne({
            _id:senderObjectId,
            "chats.with":receiverObjectId,
        });

        if(!senderHashChat)
        {
            await User.updateOne(
                {_id:senderObjectId},
                {
                    $push:{
                        chats:{
                            with:receiverObjectId,
                            messages:[
                                {
                                    sender:senderObjectId,
                                    text,
                                    createdAt:new Date(),
                                },
                            ],
                        },
                    },
                },
            );
        }
        //sace in receiver
        await User.updateOne(
            {
                _id:receiverId,
                "chats.with":senderObjectId,
            },
            {
                $push:{
                    "chats.$.messages":{
                        sender:senderObjectId,
                        text,
                        createdAt:new Date(),
                    },
                },
            }
        );
        const receiverHasChat=await User.findOne({
            _id:receiverObjectId,
            "chats.with":senderObjectId,
        });

        if(!receiverHasChat)
        {
            await User.updateOne(
                {_id:receiverObjectId},
                {
                    $push:{
                        chats:{
                            with:senderObjectId,
                            messages:[
                                {
                                    sender:senderObjectId,
                                    text,
                                    createdAt:new Date(),
                                },
                            ],
                        },
                    },
                }
            );
        }
        return NextResponse.json({success:true});
    } catch (error) {
        console.log("SEND MESSAGE ERROR:",error);
        return NextResponse.json(
            {message:"Server error"},
            {status:500}
        )
    }
}