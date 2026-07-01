import { auth } from "@/auth";

/** Returns null when session cookie is invalid/expired instead of throwing JWTSessionError */
export async function safeAuth() {
  try {
    return await auth();
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : String(error);
    if (
      name === "JWTSessionError" ||
      message.includes("decryption secret") ||
      message.includes("JWE")
    ) {
      return null;
    }
    throw error;
  }
}
