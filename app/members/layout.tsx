"use client";

import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
