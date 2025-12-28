import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = process.env.COOKIE_NAME || "geekfaka_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 Days
const log = logger.child({ module: 'Auth' });

// Get secret from env or fallback (in production, ENV should be set)
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
    
    // Check role (simple check)
    if (payload.role !== "admin") return false;

    // Sliding Expiration: Issue a new token with fresh expiration
    // This keeps the session alive as long as the user is active
    // Only refresh if the token is halfway through its life (optimization) or just refresh every time for simplicity
    // For now, we will just refresh the cookie expiry, but ideally we should re-sign a new token if we want to extend the JWT's internal exp.
    // However, since we verify signature only and rely on cookie maxAge mostly for persistence, 
    // let's re-sign to be safe about internal 'exp' claim if we add one.
    
    // Let's just re-set the cookie with the SAME token to extend browser cookie life.
    // Re-signing every request is expensive and unnecessary unless we use short-lived access tokens.
    // Given we rely on cookie persistence, extending the cookie is enough.
    try {
       cookieStore.set(COOKIE_NAME, session.value, getCookieOptions());
    } catch (e) {
       // Ignore errors in readonly contexts
    }

    return true;
  } catch (error) {
    // Token invalid or expired
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
      .setExpirationTime("30d") // Match session duration
      .sign(JWT_SECRET);

    const cookieStore = cookies();
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
