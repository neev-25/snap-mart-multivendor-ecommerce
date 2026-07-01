import mongoose from "mongoose"
import { IUser } from "./user.model";

export interface IProduct{
_id:mongoose.Types.ObjectId;
title:string;
description:string;
price:number;

stock:number;
isStockAvailable?:boolean;

image1:string;
image2:string;
image3:string;
image4:string;

vendor:IUser;

category:string;

isWearable:boolean;
sizes?:string[];

verificationStatus:"pending"|"approved"|"rejected"
requestedAt:Date;
approvedAt:Date;
rejectedReason?:string;

isActive:boolean;

replacementDays?:number;
freeDelivery?:boolean;
warranty?:string;
payOnDelivery?:boolean;

detailsPoints:string[];

visualEmbeddings?: number[][];
visualIndexedAt?: Date;

lastApprovedSnapshot?:{
    title?:string;
    description?:string;
    price?:number;
    stock?:number;
    category?:string;
    freeDelivery?:boolean;
    payOnDelivery?:boolean;
    warranty?:string;
    replacementDays?:number;
    isWearable?:boolean;
    sizes?:string[];
    detailsPoints?:string[];
    image1?:string;
};
isUpdateRequest?:boolean;

vendorCommissionPercent?:number;
adminCounterCommissionPercent?:number;
agreedCommissionPercent?:number;
commissionStatus?:"pending"|"admin_countered"|"agreed";

reviews?:{
    user:IUser;
    // rating?:string;
    rating?:number;
    comment?:string;
    image?:string;
    createdAt?:Date;
}[];

createdAt?:Date;
updatedAt?:Date;


}
const productSchema=new mongoose.Schema<IProduct>({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    isStockAvailable:{
        type:Boolean,
        default:true
    },
    vendor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    image1:{
        type:String,
        required:true
    },
    image2:{
        type:String,
        required:true
    },
    image3:{
        type:String,
        required:true
    },
    image4:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    isWearable:{
        type:Boolean,
        default:false
    },
    sizes:{
        type:[String],
        default:[]
    },
    verificationStatus:{
        type:String,
        enum:["pending","approved","rejected"],
        default:"pending"
    },
    approvedAt:{
        type:Date
    },
    requestedAt:{
        type:Date
    },
    rejectedReason:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:false
    },
    replacementDays:{
        type:Number,
        default:0,
    },
    freeDelivery:{
        type:Boolean,
        default:false,
    },
    warranty:{
        type:String,
        default:"No Warranty"
    },
    payOnDelivery:{
        type:Boolean,
        default:true
    },
    detailsPoints:{
        type:[String],
        default:[],
    },
    visualEmbeddings:{ type:[[Number]] },
    visualIndexedAt:{ type:Date },
    lastApprovedSnapshot:{
        type:mongoose.Schema.Types.Mixed,
    },
    isUpdateRequest:{
        type:Boolean,
        default:false,
    },
    vendorCommissionPercent:{
        type:Number,
        min:0,
        max:100,
    },
    adminCounterCommissionPercent:{
        type:Number,
        min:0,
        max:100,
    },
    agreedCommissionPercent:{
        type:Number,
        min:0,
        max:100,
    },
    commissionStatus:{
        type:String,
        enum:["pending","admin_countered","agreed"],
        default:"pending",
    },
    reviews:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true,
            },
            rating:{
                type:Number,
                required:true,
                min:1,
                max:5,
            },
            comment:{
                type:String,
                trim:true,
            },
            image:{
                type:String
            },
            createdAt:{
                type:Date,
                default:Date.now,
            },
        },
    ],   
},{timestamps:true})

if (process.env.NODE_ENV === "development" && mongoose.models?.Product) {
  mongoose.deleteModel("Product");
}

const Product=mongoose.models?.Product || mongoose.model<IProduct>("Product",productSchema);
export default Product; 
