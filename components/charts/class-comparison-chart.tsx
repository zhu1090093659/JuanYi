"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ClassComparisonChartProps {
  data: {
    class: string
    avgScore: number
    maxScore: number
    minScore: number
  }[]
}

export function ClassComparisonChart({ data }: ClassComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="class" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="avgScore" fill="#8884d8" name="平均分" />
        <Bar dataKey="maxScore" fill="#82ca9d" name="最高分" />
        <Bar dataKey="minScore" fill="#ffc658" name="最低分" />
      </BarChart>
    </ResponsiveContainer>
  )
}

