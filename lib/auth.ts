import { cookies } from "next/headers";

const COOKIE_NAME = process.env.COOKIE_NAME || "geekfaka_admin_session";

export async function isAuthenticated() {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME);
  // In a real app, this should be a signed JWT. 
  // For simplicity, we check if the cookie exists and matches a simple hash or just existence if we trust the setter.
  // Here we just check if it exists for the MVP.
  return !!session?.value;
}

export async function login(password: string) {
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = cookies();
    // Set cookie for 24 hours
    cookieStore.set(COOKIE_NAME, "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/"
    });
    return true;
  }
  return false;
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
