import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, BarChart2, Clock, Plus, ArrowUpRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <div className="flex items-center space-x-2">
          <Link href="/exams/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建试卷
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待批阅试卷</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">较上周增加 2 份</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已批阅学生</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">本月共批阅 245 名学生试卷</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5</div>
            <p className="text-xs text-muted-foreground">较上次提高 2.5 分</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均阅卷时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 分钟</div>
            <p className="text-xs text-muted-foreground">较传统方式节省 85%</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>最近批阅的试卷</CardTitle>
            <CardDescription>查看最近批阅的试卷及其基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                {
                  id: 1,
                  name: "期中考试 - 高二数学",
                  date: "2024-04-15",
                  students: 42,
                  avgScore: 76.8,
                },
                {
                  id: 2,
                  name: "单元测试 - 初三物理",
                  date: "2024-04-12",
                  students: 38,
                  avgScore: 82.3,
                },
                {
                  id: 3,
                  name: "月考 - 高一英语",
                  date: "2024-04-10",
                  students: 45,
                  avgScore: 79.5,
                },
                {
                  id: 4,
                  name: "期末考试 - 初二语文",
                  date: "2024-04-05",
                  students: 40,
                  avgScore: 85.2,
                },
              ].map((exam) => (
                <div key={exam.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{exam.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.date} · {exam.students} 名学生 · 平均分 {exam.avgScore}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <Link href={`/exams/${exam.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>需要关注的学生</CardTitle>
            <CardDescription>这些学生在最近的考试中表现异常</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                {
                  id: 1,
                  name: "李明",
                  class: "高二(3)班",
                  issue: "数学成绩下降 15 分",
                },
                {
                  id: 2,
                  name: "张华",
                  class: "初三(2)班",
                  issue: "物理答题不完整",
                },
                {
                  id: 3,
                  name: "王芳",
                  class: "高一(1)班",
                  issue: "英语写作能力下降",
                },
                {
                  id: 4,
                  name: "刘洋",
                  class: "初二(4)班",
                  issue: "语文理解能力需提升",
                },
              ].map((student) => (
                <div key={student.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.class} · {student.issue}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <Link href={`/students/${student.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

