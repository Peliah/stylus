export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-border flex h-14 items-center border-b px-6">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
          S
        </span>
        <span className="font-heading ml-2 text-sm font-semibold">Stylus setup</span>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
