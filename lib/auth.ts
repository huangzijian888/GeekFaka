import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = process.env.COOKIE_NAME || "geekfaka_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 Days
const log = logger.child({ module: 'Auth' });

// Get secret from env or fallback
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "default-secret-please-change"
);

function getCookieOptions() {
  const isSecure = process.env.ENABLE_SECURE_COOKIE === "true";
  return { 
    httpOnly: true, 
    secure: isSecure, 
    maxAge: SESSION_DURATION,
    sameSite: "lax" as const,
    path: "/"
  };
}

export async function isAuthenticated() {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME);
  
  if (!session?.value) return false;

  try {
    // Verify JWT
    const { payload } = await jwtVerify(session.value, JWT_SECRET);
    
    // Check role
    if (payload.role !== "admin") return false;

    return true;
  } catch (error) {
    // CRITICAL FIX: If the token is invalid (e.g. old "true" string or expired), 
    // we MUST try to clear it to prevent the browser from sending it again and again.
    // Note: delete() might fail in some read-only render phases, but it's best effort.
    try {
      cookieStore.delete(COOKIE_NAME);
    } catch (e) {}
    
    return false;
  }
}

export async function login(password: string) {
  // 1. Try DB Password
  const dbSetting = await prisma.systemSetting.findUnique({
    where: { key: "admin_password" }
  });

  const validPassword = dbSetting?.value || process.env.ADMIN_PASSWORD;

  if (password === validPassword) {
    // Generate JWT
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const cookieStore = cookies();
    // Use consistent options
    cookieStore.set(COOKIE_NAME, token, getCookieOptions());
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
