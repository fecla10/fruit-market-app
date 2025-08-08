"use client"

import { SessionProvider } from "next-auth/react"
import type { PropsWithChildren } from "react"

interface AuthProviderProps extends PropsWithChildren {}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}