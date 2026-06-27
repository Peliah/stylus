"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

const chartConfig = {
  orders: { label: "Orders", color: "var(--chart-1)" },
} satisfies ChartConfig

export function OrdersChart({
  data,
}: {
  data: { label: string; orders: number; revenue: number }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Orders — last 7 days</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
