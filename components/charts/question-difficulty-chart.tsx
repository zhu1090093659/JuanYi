"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts"

interface QuestionDifficultyChartProps {
  data: {
    id: string
    number: number
    correctRate: number
    discrimination: number
    score: number
  }[]
}

export function QuestionDifficultyChart({ data }: QuestionDifficultyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="correctRate"
          name="正确率"
          unit="%"
          domain={[0, 100]}
          label={{ value: "正确率 (%)", position: "insideBottom", offset: -5 }}
        />
        <YAxis
          type="number"
          dataKey="discrimination"
          name="区分度"
          domain={[0, 1]}
          label={{ value: "区分度", angle: -90, position: "insideLeft" }}
        />
        <ZAxis type="number" dataKey="score" range={[60, 400]} name="分值" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(value, name, props) => {
            if (name === "分值") return [`${value} 分`, name]
            if (name === "正确率") return [`${value}%`, name]
            return [value, name]
          }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="bg-background border rounded p-2 shadow-sm">
                  <p className="font-medium">{`题目 ${data.number}`}</p>
                  <p>{`正确率: ${data.correctRate}%`}</p>
                  <p>{`区分度: ${data.discrimination.toFixed(2)}`}</p>
                  <p>{`分值: ${data.score} 分`}</p>
                </div>
              )
            }
            return null
          }}
        />
        <Scatter name="题目" data={data} fill="#8884d8" shape="circle" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

