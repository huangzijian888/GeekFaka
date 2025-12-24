import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const COOKIE_NAME = process.env.COOKIE_NAME || "geekfaka_admin_session";
const log = logger.child({ module: 'Auth' });

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
    // Only enable secure cookies if explicit HTTPS URL is configured or we are in production but allowing override
    // Common issue: Docker production run on HTTP (localhost) fails with secure: true
    const isHttps = process.env.NEXT_PUBLIC_URL?.startsWith("https");
    
    cookieStore.set(COOKIE_NAME, "true", { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production" && isHttps, 
      maxAge: 60 * 60 * 24,
      path: "/"
    });
    log.info("Admin login successful");
    return true;
  }
  
  log.warn("Admin login failed: Invalid password");
  return false;
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
  log.info("Admin logout");
}
