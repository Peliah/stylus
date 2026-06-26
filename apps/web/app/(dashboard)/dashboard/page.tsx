export default function DashboardPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        Vendor overview and KPIs will live here. The marketing landing page is at{" "}
        <a href="/" className="text-primary underline-offset-4 hover:underline">
          /
        </a>
        .
      </p>
    </div>
  )
}
