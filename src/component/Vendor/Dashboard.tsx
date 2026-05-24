import UseGetAllOrdersData from '@/hooks/UseGetAllOrdersData'
import UseGetAllProducts from '@/hooks/UseGetAllProductsData'
import UseGetAllVendor from '@/hooks/UseGetAllVendor'
import UseGetCurrentUser from '@/hooks/UseGetCurrentUser'
import { IUser } from '@/model/user.model'
import { RootState } from '@/redux/store'
import React from 'react'
import { useSelector } from 'react-redux'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function Dashboard() {
  UseGetAllOrdersData()
  UseGetAllProducts()
  UseGetCurrentUser()
  const {allProductsData}=useSelector((state:RootState)=>state.vendor)
  const {allOrdersData}=useSelector((state:RootState)=>state.user)
  const {userData}=useSelector((state:RootState)=>state.user)
  
  const vendorOrders=allOrdersData.filter((o:any)=>String(o.productVendor?._id || o.productVendor)===String(userData?._id));
  const vendorProducts=allProductsData.filter((p:any)=>String(p.vendor?._id || p.vendor)===String(userData?._id));
  const validOrders=vendorOrders.filter((o:any)=>o.orderStatus!=="cancelled" && o.orderStatus!=="returned" );
  let totalSales=0;
  const customers=new Set<string>();
  validOrders.forEach((o:any)=>{
    totalSales+=o.totalAmount;
    customers.add(String(o.buyer?._id || o.buyer))
  });

  const deliveredOrders=vendorOrders.filter((o:any)=>o.orderStatus==="delivered");
  const cancelledOrders=vendorOrders.filter((o:any)=>o.orderStatus==="cancelled");
  const returnedOrders=vendorOrders.filter((o:any)=>o.orderStatus==="returned");
  const remainingOrders=vendorOrders.filter((o:any)=>!["delivered","cancelled","returned"].includes(o.orderStatus));

  const orderProgress=[
    {name:"Delivered",value:deliveredOrders.length},
    {name:"Pending",value:remainingOrders.length},
    {name:"Cancelled",value:cancelledOrders.length},
    {name:"Returned",value:returnedOrders.length},
  ];

  const COLORS=["#22c55e","#3b82f6","#ef4444","#f97316"];

  const ordersDateMap:Record<string,number>={};
  validOrders.forEach((o:any)=>{
    const d=new Date(o.createdAt).toLocaleDateString("en-IN");
    ordersDateMap[d]=(ordersDateMap[d]||0)+1;
  });

  const ordersByDate=Object.keys(ordersDateMap).map((d)=>({
    date:d,
    orders:ordersDateMap[d],
  }));

  const productSalesMap:Record<string,number>={};
  validOrders.forEach((o:any)=>
    o.products.forEach((p:any)=>{
      const t=p.product?.title||"Unknown";
      productSalesMap[t]=(productSalesMap[t]||0)+p.quantity;
    })
  );
  const productSales=Object.keys(productSalesMap).map((t)=>({
    product:t.length>12 ? t.slice(0,12)+"...":t,
    sold:productSalesMap[t],
  }))


  return (
    <div className='min-h-screen w-full px-4 sm:px-6 py-6 text-white'>
      <div className='max-w-full mx-auto space-y-8'>

        <div className='bg-white/5 border border-white/10 rounded-xl p-5'>
          <h1 className='text-xl sm:text-2xl font-bold'>
            {userData?.shopName}
          </h1>
          <p className='text-xs sm:text-sm text-gray-400 break-all'>
            {userData?.email}
          </p>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          <Statebox title="Customers" value={customers.size}/>
          <Statebox title="Products" value={vendorProducts.length}/>
          <Statebox title="Orders" value={validOrders.length}/>
          <Statebox title="Sales" value={`₹ ${totalSales}`}/>
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Bar Graph */}
          <div className='bg-white/5 border border-white/10 rounded-xl p-4 h-[280px] sm:h-[490px]'>
          <h2 className='font-semibold mb-2 text-sm'>
            Orders by Date
          </h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersByDate}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis
              dataKey="date"
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
        <div className='bg-white/5 border border-white/10 rounded-2xl p-4 h-[260px] sm:h-[320px]'>
        <h2 className='text-sm font-semibold mb-2'>Product Sales</h2>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={productSales}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis
              dataKey="product"
              interval={0}
              angle={-20}
              textAnchor='end'
              height={50}
              tick={{fontSize:10}}
              />
              <YAxis tick={{fontSize:10}}/>
              <Tooltip/>
              <Line
              type="monotone"
              dataKey="sold"
              stroke='#6366f1'
              strokeWidth={2}
              />
              </LineChart>
          </ResponsiveContainer>
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