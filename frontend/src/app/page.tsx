"use client";

import { AuthGate } from "@/components/AuthGate";
import { Tracker } from "@/components/Tracker";

export default function Page() {
  return (
    <AuthGate>
      {(member, logout) => <Tracker member={member} onLogout={logout} />}
    </AuthGate>
  );
}
