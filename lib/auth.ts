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
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(COOKIE_NAME);
    
    if (!session?.value) return false;

    // Verify JWT with clock tolerance to handle slight server time drifts
    const { payload } = await jwtVerify(session.value, JWT_SECRET, {
      clockTolerance: "1m"
    });
    
    if (payload.role !== "admin") {
      log.warn("Auth failed: Invalid role in token");
      return false;
    }

    return true;
  } catch (error: any) {
    // Log the specific error to help troubleshooting
    // Important: check your server/docker logs for this message
    log.error({ err: error.message, code: error.code }, "JWT verification failed");
    return false;
  }
}

export async function login(password: string) {
  const dbSetting = await prisma.systemSetting.findUnique({
    where: { key: "admin_password" }
  });

  const validPassword = dbSetting?.value || process.env.ADMIN_PASSWORD;

  if (password === validPassword) {
    // Generate JWT - We remove internal expiration and rely on Cookie maxAge for session management.
    // This is more robust against time synchronization issues.
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
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
