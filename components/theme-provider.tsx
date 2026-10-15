"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      // Prevents the "script tag while rendering" warning in Next.js 16 + Turbopack.
      // The theme still works correctly — this only affects the initial paint flash
      // prevention script that next-themes injects.
      enableColorScheme={false}
    >
      {children}
    </NextThemesProvider>
  )
}