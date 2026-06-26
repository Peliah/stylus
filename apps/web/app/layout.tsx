import type { Metadata } from "next"
import { Geist_Mono, Outfit, Montserrat } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { GatewayStatusBanner } from "@/components/gateway-status-banner"

const montserratHeading = Montserrat({ subsets: ["latin"], variable: "--font-heading" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Stylus CRM — WhatsApp Sales Intelligence",
  description: "AI-powered conversational CRM for WhatsApp vendors. Manage orders, inventory, and customers from one dashboard.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, outfit.variable, montserratHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <GatewayStatusBanner />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
