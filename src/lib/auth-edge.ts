import { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

// Edge-compatible auth configuration for middleware
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnWatchlist = nextUrl.pathname.startsWith('/watchlist')
      const isOnPortfolio = nextUrl.pathname.startsWith('/portfolio')
      const isOnCharts = nextUrl.pathname.startsWith('/charts')
      const isOnAlerts = nextUrl.pathname.startsWith('/alerts')
      
      if (isOnDashboard || isOnWatchlist || isOnPortfolio || isOnCharts || isOnAlerts) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
  },
} satisfies NextAuthConfig
