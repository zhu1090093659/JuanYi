"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface StudentProgressChartProps {
  data: {
    examName: string
    date: string
    score: number
    classAvg: number
  }[]
}

export function StudentProgressChart({ data }: StudentProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="examName" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} name="学生分数" />
        <Line type="monotone" dataKey="classAvg" stroke="#82ca9d" name="班级平均分" />
      </LineChart>
    </ResponsiveContainer>
  )
}

