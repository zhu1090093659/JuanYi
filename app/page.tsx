import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, BookOpen, Award, BarChart3, Users, Shield, Settings } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">卷知</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">登录</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">注册</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 mb-2">
                    智能教育新时代
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl/none">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">卷知</span> - 智能阅卷，提高教学效率
                  </h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl dark:text-gray-400">
                    面向中学和大学教师的智能阅卷平台，通过 AI 技术批量处理各类试题，提高阅卷效率，保证评分一致性。
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-200">
                      立即体验
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline" className="gap-2 border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      查看演示
                    </Button>
                  </Link>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    <span>批量处理</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    <span>精准评分</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    <span>数据分析</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] h-[400px] rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 z-0"></div>
                  <Image
                    src="/placeholder.svg?height=400&width=500"
                    alt="卷知智能阅卷平台演示"
                    className="object-cover z-10"
                    fill
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-3">
                <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 mb-2">
                  强大功能
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">智能阅卷</span>
                  解决方案
                </h2>
                <p className="max-w-[800px] text-gray-600 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed mx-auto">
                  我们的平台提供全面的智能阅卷解决方案，满足各类教育机构的需求
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-start space-y-4 rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <div className="rounded-full bg-blue-100 p-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">多类型试题智能评阅</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  支持客观题自动评分、半主观题智能识别、主观题深度理解和多媒体答案评阅。
                </p>
              </div>
              <div className="flex flex-col items-start space-y-4 rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <div className="rounded-full bg-blue-100 p-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">数据分析与报告</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  提供成绩统计分析、试题难度分析、学生能力诊断和教学方向建议。
                </p>
              </div>
              <div className="flex flex-col items-start space-y-4 rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <div className="rounded-full bg-indigo-100 p-3">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">试卷处理系统</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  支持多格式导入、OCR 识别和批量处理整个班级或年级的试卷。
                </p>
              </div>
              <div className="flex flex-col items-start space-y-4 rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <div className="rounded-full bg-purple-100 p-3">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">评分标准定制</h3>
                <p className="text-gray-600 dark:text-gray-400">自定义评分规则、建立参考答案库和人工干预机制。</p>
              </div>
              <div className="flex flex-col items-start space-y-4 rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <div className="rounded-full bg-indigo-100 p-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">协作与管理功能</h3>
                <p className="text-gray-600 dark:text-gray-400">支持多教师协同、权限管理和标准共享。</p>
              </div>
              <div className="flex flex-col items-start space-y-4 rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <div className="rounded-full bg-purple-100 p-3">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">安全与隐私保护</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  端到端加密传输和存储、数据脱敏处理和严格的访问权限控制。
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 mb-2">
                  为什么选择卷知
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  专注于教育评估的
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent"> AI 解决方案</span>
                </h2>
                <p className="text-gray-600 md:text-xl">
                  卷知专注于提供最先进的智能阅卷技术，帮助教师提高工作效率，同时保证评分的准确性和一致性。
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                    <span>高准确度 AI 评分，与人工评分结果高度一致</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                    <span>节省 80% 的阅卷时间，让教师专注于教学</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                    <span>丰富的数据分析，帮助教师了解学生学习情况</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                    <span>强大的安全保障，保护学生隐私和数据安全</span>
                  </li>
                </ul>
                <div className="pt-4">
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md">
                      立即免费试用
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] h-[400px] rounded-2xl overflow-hidden shadow-xl transform transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 z-0"></div>
                  <Image
                    src="/placeholder.svg?height=400&width=500"
                    alt="卷知平台优势展示"
                    className="object-cover z-10"
                    fill
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full py-6 bg-gray-50 border-t">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">卷知</span>
              </Link>
              <p className="text-sm text-gray-500">智能阅卷平台，提升教学质量与效率的得力助手。</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">产品</h4>
              <ul className="space-y-2">
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">功能介绍</Link></li>
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">定价</Link></li>
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">常见问题</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">资源</h4>
              <ul className="space-y-2">
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">使用指南</Link></li>
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">案例研究</Link></li>
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">API 文档</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">公司</h4>
              <ul className="space-y-2">
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">关于我们</Link></li>
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">联系我们</Link></li>
                <li><Link className="text-sm text-gray-500 hover:text-gray-900" href="#">加入我们</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">© 2024 卷知. 保留所有权利.</p>
            <div className="flex gap-4">
              <Link className="text-xs text-gray-500 hover:text-gray-900" href="#">
                服务条款
              </Link>
              <Link className="text-xs text-gray-500 hover:text-gray-900" href="#">
                隐私政策
              </Link>
              <Link className="text-xs text-gray-500 hover:text-gray-900" href="#">
                Cookie 设置
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

