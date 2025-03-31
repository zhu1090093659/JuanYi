import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">设置</h2>
      </div>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="ai">AI 设置</TabsTrigger>
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
          <TabsTrigger value="team">团队管理</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>更新您的个人信息和偏好设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input id="name" defaultValue="张老师" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" defaultValue="zhang@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">学校</Label>
                  <Input id="school" defaultValue="示范中学" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">主教科目</Label>
                  <Select defaultValue="math">
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">数学</SelectItem>
                      <SelectItem value="chinese">语文</SelectItem>
                      <SelectItem value="english">英语</SelectItem>
                      <SelectItem value="physics">物理</SelectItem>
                      <SelectItem value="chemistry">化学</SelectItem>
                      <SelectItem value="biology">生物</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存更改</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>界面设置</CardTitle>
              <CardDescription>自定义界面显示和行为</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">深色模式</Label>
                  <p className="text-sm text-muted-foreground">启用深色模式以减少眼睛疲劳</p>
                </div>
                <Switch id="dark-mode" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">自动保存</Label>
                  <p className="text-sm text-muted-foreground">自动保存评分结果和批注</p>
                </div>
                <Switch id="auto-save" defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="language">语言</Label>
                <Select defaultValue="zh">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="选择语言" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">简体中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存更改</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI 评分设置</CardTitle>
              <CardDescription>配置 AI 评分的行为和标准</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-mode">默认评分模式</Label>
                <Select defaultValue="ai-assisted">
                  <SelectTrigger id="default-mode">
                    <SelectValue placeholder="选择默认评分模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai-auto">AI 全自动评分</SelectItem>
                    <SelectItem value="ai-assisted">AI 辅助人工评分</SelectItem>
                    <SelectItem value="manual">纯人工评分</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="confidence-threshold">AI 置信度阈值</Label>
                  <span className="text-sm text-muted-foreground">80%</span>
                </div>
                <Input id="confidence-threshold" type="range" min="0" max="100" defaultValue="80" />
                <p className="text-sm text-muted-foreground">低于此置信度的答案将标记为需要人工审核</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-feedback">自动生成反馈</Label>
                  <p className="text-sm text-muted-foreground">AI 自动为学生生成个性化反馈</p>
                </div>
                <Switch id="auto-feedback" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="learning-mode">AI 学习模式</Label>
                  <p className="text-sm text-muted-foreground">允许 AI 从您的评分习惯中学习</p>
                </div>
                <Switch id="learning-mode" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存更改</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>OCR 设置</CardTitle>
              <CardDescription>配置光学字符识别的参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enhance-handwriting">手写增强</Label>
                  <p className="text-sm text-muted-foreground">增强手写文字的识别准确率</p>
                </div>
                <Switch id="enhance-handwriting" defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="ocr-language">OCR 语言</Label>
                <Select defaultValue="zh">
                  <SelectTrigger id="ocr-language">
                    <SelectValue placeholder="选择 OCR 语言" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">简体中文</SelectItem>
                    <SelectItem value="en">英文</SelectItem>
                    <SelectItem value="math">数学公式</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存更改</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>配置您希望接收的通知类型和方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">邮件通知</Label>
                  <p className="text-sm text-muted-foreground">通过邮件接收重要通知</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notifications">短信通知</Label>
                  <p className="text-sm text-muted-foreground">通过短信接收重要通知</p>
                </div>
                <Switch id="sms-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="grading-complete">评分完成通知</Label>
                  <p className="text-sm text-muted-foreground">AI 完成批量评分时通知我</p>
                </div>
                <Switch id="grading-complete" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="review-required">需要审核通知</Label>
                  <p className="text-sm text-muted-foreground">有答案需要人工审核时通知我</p>
                </div>
                <Switch id="review-required" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存更改</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>团队管理</CardTitle>
              <CardDescription>管理您的团队成员和权限</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">李老师</p>
                    <p className="text-sm text-muted-foreground">li@example.com - 数学教师</p>
                  </div>
                  <Select defaultValue="editor">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="editor">编辑者</SelectItem>
                      <SelectItem value="viewer">查看者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">王老师</p>
                    <p className="text-sm text-muted-foreground">wang@example.com - 物理教师</p>
                  </div>
                  <Select defaultValue="viewer">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="editor">编辑者</SelectItem>
                      <SelectItem value="viewer">查看者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">赵老师</p>
                    <p className="text-sm text-muted-foreground">zhao@example.com - 英语教师</p>
                  </div>
                  <Select defaultValue="editor">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="editor">编辑者</SelectItem>
                      <SelectItem value="viewer">查看者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">邀请成员</Button>
              <Button>保存更改</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

