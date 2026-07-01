/** Pages anyone can visit without signing in */
export const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/category",
  "/shop",
  "/viewProduct",
  "/shopDetails",
] as const;

/** Pages that always require a signed-in user */
export const AUTH_REQUIRED_PREFIXES = [
  "/cart",
  "/checkout",
  "/wishlist",
  "/orders",
  "/profile",
  "/support",
  "/addVendorProduct",
  "/updateProduct",
] as const;

export function isPublicPage(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAuthRequiredPage(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
