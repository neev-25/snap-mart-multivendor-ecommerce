import { safeAuth } from "@/lib/safeAuth";
import AdminDashboard from "@/component/Admin/AdminDashboard";
import EditRoleandPhone from "@/component/EditRoleandPhone";
import UserDashBoard from "@/component/User/UserDashBoard";
import EditVendorDetails from "@/component/Vendor/EditVendorDetails";
import VendorPage from "@/component/Vendor/VendorPage";
import connectDb from "@/lib/connectDB";
import User from "@/model/user.model";
import React from "react";

export default async function Home() {
  await connectDb();
  const session = await safeAuth();

  if (!session?.user?.id) {
    return <UserDashBoard />;
  }

  const user = await User.findById(session.user.id);
  if (!user) {
    return <UserDashBoard />;
  }

  const inComplete = !user.phone;
  if (inComplete) {
    return <EditRoleandPhone />;
  }

  if (user.role == "vendor") {
    const isCompleteDetails = !user.shopName || !user.shopAddress || !user.gstNumber;
    if (isCompleteDetails) {
      return <EditVendorDetails />;
    }
  }

  const plainUser = JSON.parse(JSON.stringify(user));
  return (
    <>
      {user.role == "user" ? (
        <UserDashBoard />
      ) : user?.role == "vendor" ? (
        <VendorPage user={plainUser} />
      ) : (
        <AdminDashboard />
      )}
    </>
  );
}
