import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "queuesense-staff",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function passcodeMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const staffSignIn = createServerFn({ method: "POST" })
  .inputValidator((data: { passcode: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env["STAFF_PASSCODE"];
    if (!expected) throw new Error("STAFF_PASSCODE is not set");
    if (!data?.passcode || !passcodeMatches(data.passcode, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<GateSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const staffSignOut = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const getStaffStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  return { signedIn: session.data.unlocked === true };
});

export const requireStaff = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  if (!session.data.unlocked) throw redirect({ to: "/staff-login" });
  return { signedIn: true as const };
});
