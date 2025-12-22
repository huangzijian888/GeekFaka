import { NextResponse } from "next/server";
import { login, logout } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const success = await login(password);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ success: true });
}
