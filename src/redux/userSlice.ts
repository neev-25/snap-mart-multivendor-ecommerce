import { IOrder } from "@/model/order.model"
import { IProduct } from "@/model/product.model"
import { IUser } from "@/model/user.model"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface IUserData{
    userData:IUser|null,
    allOrdersData:IOrder[],
    wishlist: IProduct[],
    wishlistIds: string[],
}
const initialState:IUserData={
    userData:null,
    allOrdersData:[],
    wishlist: [],
    wishlistIds: [],
}
const userSlice=createSlice({
    name:"user",
    initialState,
    reducers:{
        setUserData:(state,action)=>{
            state.userData=action.payload
        },
        setAllOrdersData:(state,action)=>{
            state.allOrdersData=action.payload
        },
        setWishlistData:(state, action: PayloadAction<{ products: IProduct[]; ids: string[] }>) => {
            state.wishlist = action.payload.products
            state.wishlistIds = action.payload.ids
        },
        setWishlist:(state, action: PayloadAction<IProduct[]>) => {
            state.wishlist = action.payload
            state.wishlistIds = action.payload
                .map((p) => String(p._id))
                .filter(Boolean)
        },
        addWishlistItem:(state, action: PayloadAction<IProduct>) => {
            const id = String(action.payload._id)
            if (!state.wishlistIds.includes(id)) {
                state.wishlistIds.push(id)
                state.wishlist.push(action.payload)
            }
        },
        removeWishlistItem:(state, action: PayloadAction<string>) => {
            const id = String(action.payload)
            state.wishlistIds = state.wishlistIds.filter((w) => w !== id)
            state.wishlist = state.wishlist.filter((p) => String(p._id) !== id)
        },
        setWishlistIds:(state, action: PayloadAction<string[]>) => {
            state.wishlistIds = action.payload
        },

    }
})
export const {setUserData,setAllOrdersData,setWishlist,setWishlistData,addWishlistItem,removeWishlistItem,setWishlistIds}=userSlice.actions
export default userSlice.reducer