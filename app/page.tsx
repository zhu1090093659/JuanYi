import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold">AI 阅卷平台</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">登录</Button>
          </Link>
          <Link href="/register">
            <Button>注册</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    AI 辅助阅卷，提高教学效率
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    面向中学和大学教师的智能阅卷平台，通过 AI 技术批量处理各类试题，提高阅卷效率，保证评分一致性。
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="gap-1">
                      开始使用
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline">
                      查看演示
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/placeholder.svg?height=400&width=500"
                  alt="AI 阅卷平台演示"
                  className="rounded-lg object-cover"
                  width={500}
                  height={400}
                />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">核心功能</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  我们的平台提供全面的智能阅卷解决方案
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-start space-y-2 rounded-lg border p-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">多类型试题智能评阅</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  支持客观题自动评分、半主观题智能识别、主观题深度理解和多媒体答案评阅。
                </p>
              </div>
              <div className="flex flex-col items-start space-y-2 rounded-lg border p-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">试卷处理系统</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  支持多格式导入、OCR 识别和批量处理整个班级或年级的试卷。
                </p>
              </div>
              <div className="flex flex-col items-start space-y-2 rounded-lg border p-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">评分标准定制</h3>
                <p className="text-gray-500 dark:text-gray-400">自定义评分规则、建立参考答案库和人工干预机制。</p>
              </div>
              <div className="flex flex-col items-start space-y-2 rounded-lg border p-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">数据分析与报告</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  提供成绩统计分析、试题难度分析、学生能力诊断和教学方向建议。
                </p>
              </div>
              <div className="flex flex-col items-start space-y-2 rounded-lg border p-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">协作与管理功能</h3>
                <p className="text-gray-500 dark:text-gray-400">支持多教师协同、权限管理和标准共享。</p>
              </div>
              <div className="flex flex-col items-start space-y-2 rounded-lg border p-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">安全与隐私保护</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  端到端加密传输和存储、数据脱敏处理和严格的访问权限控制。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 AI 阅卷平台. 保留所有权利.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            条款
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            隐私
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            联系我们
          </Link>
        </nav>
      </footer>
    </div>
  )
}

