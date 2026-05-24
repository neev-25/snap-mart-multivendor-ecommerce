import UseGetAllOrdersData from '@/hooks/UseGetAllOrdersData'
import UseGetAllProducts from '@/hooks/UseGetAllProductsData'
import UseGetAllVendor from '@/hooks/UseGetAllVendor'
import { IUser } from '@/model/user.model'
import { RootState } from '@/redux/store'
import React from 'react'
import { useSelector } from 'react-redux'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function Dashboard() {
  UseGetAllOrdersData()
  UseGetAllProducts()
  UseGetAllVendor()
  const {allVendorData,allProductsData}=useSelector((state:RootState)=>state.vendor)
  const {allOrdersData}=useSelector((state:RootState)=>state.user)
  const vendors=allVendorData||[]
  const pendingVendors=allVendorData.filter((v)=>v.verificationStatus==="pending")
  const products=allProductsData||[]
  const pendingProducts=allProductsData.filter((p)=>p.verificationStatus==="pending")
  const orders=allOrdersData||[]
  const deliveredOrders=allOrdersData.filter((o)=>o.orderStatus==="delivered")
  let totalEarnings=0
  deliveredOrders.forEach((o)=>{
    if(o.isPaid)
    {
      totalEarnings+=o.totalAmount;
    }
  })
  const vendorOrderGraph:{vendor:string,orders:number}[]=[];

  for(let i=0;i<allOrdersData.length;i++)
  {
    const order=allOrdersData[i];
    let vendorName=order.productVendor?.shopName||"Unknown";

    if(vendorName.length>14)
    {
      vendorName=vendorName.slice(0,14)+"...";
    }
    let found=false;
    for(let j=0;j<vendorOrderGraph.length;j++)
    {
      if(vendorOrderGraph[j].vendor===vendorName)
      {
        vendorOrderGraph[j].orders=vendorOrderGraph[j].orders+1;
        found=true;
        break;
      }
    } 
    if(!found)
    {
     vendorOrderGraph.push({
      vendor:vendorName,
      orders:1
     })
    }
  }

  const cancelledOrders=allOrdersData.filter((o:any)=>o.orderStatus==="cancelled");
  const returnedOrders=allOrdersData.filter((o:any)=>o.orderStatus==="returned");
  const remainingOrders=allOrdersData.filter((o:any)=>!["delivered","cancelled","returned"].includes(o.orderStatus));

  const orderProgress=[
    {name:"Delivered",value:deliveredOrders.length},
    {name:"Pending",value:remainingOrders.length},
    {name:"Cancelled",value:cancelledOrders.length},
    {name:"Returned",value:returnedOrders.length},
  ];

  const COLORS=["#22c55e","#3b82f6","#ef4444","#f97316"];



  return (
    <div className='min-h-screen w-full px-4 sm:px-6 py-6 text-white'>
      <div className='max-w-full mx-auto space-y-8'>
        <h2 className='text-xl sm:text-2xl font-bold'>Admin Dashboard</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
          <Statebox title="Total Vendors" value={vendors.length}/>
          <Statebox title="Pending Vendors" value={pendingVendors.length}/>
          <Statebox title="Total Products" value={products.length}/>
          <Statebox title="Pending Products" value={pendingProducts.length}/>
          <Statebox title="Total Orders" value={orders.length}/>
          <Statebox title="Total Earnings" value={`₹ ${totalEarnings}`}/>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {
            vendors.map((vendor:IUser,i:number)=>{
              const vendorProducts=allProductsData.filter(
                (p:any)=>String(p.vendor?._id || p.vendor)===String(vendor._id)
              );
              const vendorOrders=allOrdersData.filter(
                (o:any)=>String(o.productVendor?._id || o.productVendor)===String(vendor._id)
              );
              const cancelled=vendorOrders.filter((o:any)=>o.orderStatus==="cancelled").length;
              const returned=vendorOrders.filter((o:any)=>o.orderStatus==="returned").length;
              const delivered=vendorOrders.filter((o:any)=>o.orderStatus==="delivered").length
              let vendorEarning=0;
              vendorOrders.forEach((o:any)=>{
                if(o.isPaid)
                {
                  vendorEarning+=o.totalAmount;
                }
              });
              return(
                <div
                key={i}
                className='bg-white/5 border border-white/10 rounded-xl p-4'
                >
                  <h2 className='font-semibold text-base truncate'>
                    {vendor.shopName}
                  </h2>
                  <p className='text-xs text-gray-400 mb-2'>
                    Status : <span className={`
                    capitalize ${
                      vendor.verificationStatus==="approved"
                      ? "text-green-400"
                      : "text-yellow-400"
                    }`}>
                        {vendor.verificationStatus}
                      </span>
                  </p>
                  <div className='text-sm space-y-1'>
                    <p>Products: {vendorProducts.length}</p>
                    <p>Orders: {vendorOrders.length}</p>
                    <p className='text-green-400'>Delivered: {delivered}</p>
                    <p className='text-red-400'>Cancelled: {cancelled}</p>
                    <p className='text-orange-400'>Returned: {returned}</p>
                    <p className='text-green-400 font-semibold'>Earnings: ₹ {vendorEarning}</p>
                  </div>
                </div>
              )
            })
          }
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Bar Graph */}
          <div className='bg-white/5 border border-white/10 rounded-xl p-4 h-[280px] sm:h-[490px]'>
          <h2 className='font-semibold mb-2 text-sm'>
            Vendor-wise Orders
          </h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendorOrderGraph}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis
              dataKey="vendor"
              interval={0}
              angle={-20}
              textAnchor='end'
              height={50}
              tick={{fontSize:10}}
              />
              <YAxis tick={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="orders" fill='#3b82f6'/>
              </BarChart>

          </ResponsiveContainer>
          </div>
          <div className='bg-white/5 border border-white/10 rounded-xl p-4'>
          <h2 className='font-semibold mb-2 text-sm'>
            Order Status Distribution
          </h2>
          <div className='grid grid-cols-2 gap-3 mb-4'>
            <Statusbox label='Delivered' value={deliveredOrders.length} color='text-green-400'/>
            <Statusbox label='Pending' value={remainingOrders.length} color='text-blue-400'/>
            <Statusbox label='Cancelled' value={cancelledOrders.length} color='text-red-400'/>
            <Statusbox label='Returned' value={returnedOrders.length} color='text-orange-400'/>

          </div>
          <div className='h-[220px] sm:h-[260px]'>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                data={orderProgress}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
                >
                  {orderProgress.map((_,i)=>(
                    <Cell key={i} fill={COLORS[i]}/> 
                  ))}
                  </Pie>
                  <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

function Statebox({title,value}:{title:String,value:any}){
  return(
    <div className='bg-white/5 border border-white/10 rounded-xl p-4'>
      <p className='text-xs uppercase text-gray-400'>{title}</p>
      <p className='text-xs sm:text-2xl font-bold mt-1'>{value}</p>
    </div>
  )
}

function Statusbox({
  label,
  value,
  color,
}:{
  label:string,
  value:number,
  color:string,
}){
  return (
  <div className='bg-black/40 border border-white/10 rounded-lg p-3 text-center'>
    <p className='text-xs text-gray-400'>{label}</p>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
  </div>
  );
}