import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnswerGradingDemo } from "@/components/ai-grading/answer-grading-demo"

export default function AIGradingDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">AI 自动评分演示</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AnswerGradingDemo />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>AI 评分优势</CardTitle>
              <CardDescription>使用 AI 自动评分的主要优势</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">提高效率</h3>
                <p className="text-sm text-muted-foreground">AI 可以在几秒钟内评分一个答案，大大减少教师的工作量。</p>
              </div>

              <div>
                <h3 className="font-medium">一致性</h3>
                <p className="text-sm text-muted-foreground">AI 评分保持一致的标准，避免人为因素导致的评分偏差。</p>
              </div>

              <div>
                <h3 className="font-medium">详细反馈</h3>
                <p className="text-sm text-muted-foreground">
                  AI 可以提供详细的评分点和建议，帮助学生理解自己的优缺点。
                </p>
              </div>

              <div>
                <h3 className="font-medium">实时评估</h3>
                <p className="text-sm text-muted-foreground">学生可以获得即时反馈，而不必等待教师批改。</p>
              </div>

              <div>
                <h3 className="font-medium">数据分析</h3>
                <p className="text-sm text-muted-foreground">
                  AI 评分系统可以收集数据，帮助教师分析学生的学习情况和题目质量。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>适用题型</CardTitle>
              <CardDescription>AI 评分适用的题目类型</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>客观题（选择题、判断题）</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>简答题</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>计算题</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span>论述题（需教师审核）</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span>翻译题（需教师审核）</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span>作文（需教师审核）</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

