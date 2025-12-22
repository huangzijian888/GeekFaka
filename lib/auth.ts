import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = process.env.COOKIE_NAME || "geekfaka_admin_session";

export async function isAuthenticated() {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return !!session?.value;
}

export async function login(password: string) {
  // 1. Try DB Password
  const dbSetting = await prisma.systemSetting.findUnique({
    where: { key: "admin_password" }
  });

  const validPassword = dbSetting?.value || process.env.ADMIN_PASSWORD;

  if (password === validPassword) {
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
