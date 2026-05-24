import { IUser } from "@/model/user.model"
import { createSlice } from "@reduxjs/toolkit"
import { IProduct } from '../model/product.model';

interface IUserData{
    allVendorData:IUser[],
    allProductsData:IProduct[]
}
const initialState:IUserData={
    allVendorData:[],
    allProductsData:[]
}
const vendorSlice=createSlice({
    name:"vendor",
    initialState,
    reducers:{
        setAllVendorData:(state,action)=>{
            state.allVendorData=action.payload
        },
        setAllProductsData:(state,action)=>{
            state.allProductsData=action.payload
        }
    }
})
export const {setAllVendorData}=vendorSlice.actions
export const {setAllProductsData}=vendorSlice.actions
export default vendorSlice.reducer