"use client";
import UseGetAllOrdersData from "./hooks/UseGetAllOrdersData";
import UseGetAllProducts from "./hooks/UseGetAllProductsData";
import UseGetAllVendor from "./hooks/UseGetAllVendor";
import UseGetCurrentUser from "./hooks/UseGetCurrentUser";
import UseGetWishlist from "./hooks/UseGetWishlist";
import { useSession } from "next-auth/react";
import React from "react";

function InitUser() {
  const { status } = useSession();
  UseGetCurrentUser();
  UseGetAllVendor();
  UseGetAllProducts();

  if (status === "authenticated") {
    return <AuthenticatedInit />;
  }
  return null;
}

function AuthenticatedInit() {
  UseGetAllOrdersData();
  UseGetWishlist();
  return null;
}

export default InitUser;
