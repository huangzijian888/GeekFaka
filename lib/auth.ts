import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const COOKIE_NAME = process.env.COOKIE_NAME || "geekfaka_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 Days (Extended for stability)
const log = logger.child({ module: 'Auth' });

function getCookieOptions() {
  // SIMPLIFICATION: Default to non-secure to prevent 401s in Docker/Nginx/HTTP scenarios.
  // Only enable Secure if explicitly requested via env var.
  const isSecure = process.env.ENABLE_SECURE_COOKIE === "true";
  
  return { 
    httpOnly: true, 
    secure: isSecure, 
    maxAge: SESSION_DURATION,
    sameSite: "lax" as const, // Lax is safer for navigation
    path: "/"
  };
}

export async function isAuthenticated() {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME);
  
  if (session?.value) {
    // Sliding expiration: Refresh cookie on every valid request
    try {
      cookieStore.set(COOKIE_NAME, session.value, getCookieOptions());
    } catch (e) {
      // Ignore errors in readonly contexts (e.g. rendering pages)
    }
    return true;
  }
  
  return false;
}

export async function login(password: string) {
  // 1. Try DB Password
  const dbSetting = await prisma.systemSetting.findUnique({
    where: { key: "admin_password" }
  });

  const validPassword = dbSetting?.value || process.env.ADMIN_PASSWORD;

  if (password === validPassword) {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, "true", getCookieOptions());
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
