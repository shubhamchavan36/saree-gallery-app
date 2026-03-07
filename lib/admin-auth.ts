import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "saree_admin_session";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const ADMIN_SESSION_VALUE =
  process.env.ADMIN_SESSION_VALUE ?? "saree-gallery-admin-auth";

export function validateAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function getAdminSessionValue() {
  return ADMIN_SESSION_VALUE;
}

export async function hasAdminSession() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE_NAME)?.value === ADMIN_SESSION_VALUE;
}

export async function ensureAdminSession() {
  const authenticated = await hasAdminSession();
  if (authenticated) return null;
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
