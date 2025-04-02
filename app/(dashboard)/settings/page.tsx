"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getSession } from "next-auth/react"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [aiModel, setAiModel] = useState("gpt-4o")
  const [customModel, setCustomModel] = useState("")
  const [showCustomModel, setShowCustomModel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    school: ""
  })
  const { toast } = useToast()
  const router = useRouter()

  // 加载用户数据
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        
        // 使用NextAuth获取会话
        const session = await getSession()
        
        if (!session) {
          toast({
            title: "未登录",
            description: "请先登录后再访问设置页面",
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }
        
        // 使用API获取当前用户信息，传递token
        const response = await fetch('/api/users/current', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        
        if (!response.ok) {
          // 如果是用户不存在，尝试创建用户
          if (response.status === 404 && data.authUser) {
            console.log("用户在自定义表中不存在，正在创建记录...");
            
            // 通过API创建新用户记录
            const createResponse = await fetch('/api/users/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                name: data.authUser.user_metadata?.name || data.authUser.email?.split('@')[0] || "未命名用户",
                role: data.authUser.user_metadata?.role || "student",
                school: data.authUser.user_metadata?.school || ""
              }),
            });
            
            if (!createResponse.ok) {
              const errorData = await createResponse.json();
              console.error("创建用户记录失败:", errorData);
              toast({
                title: "创建用户失败",
                description: errorData.error || "无法在数据库中创建用户记录",
                variant: "destructive",
              });
              return;
            }
            
            // 获取创建的用户数据
            const createData = await createResponse.json();
            
            if (createData.success && createData.user) {
              setUserData(createData.user);
              setFormData({
                name: createData.user.name || "",
                email: createData.user.email || "",
                school: createData.user.school || ""
              });
              
              toast({
                title: "用户记录已创建",
                description: "您的用户信息已初始化",
              });
              return;
            }
          } else {
            console.error("获取用户数据失败:", data.error);
            toast({
              title: "获取数据失败",
              description: data.error || "无法加载您的个人信息",
              variant: "destructive",
            });
            return;
          }
        }
        
        // 成功获取到用户数据
        if (data.user) {
          setUserData(data.user);
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            school: data.user.school || ""
          });
        }
      } catch (error) {
        console.error("加载用户数据出错:", error);
        toast({
          title: "加载失败",
          description: "获取用户信息失败",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    
    // 从本地存储加载API设置
    const savedApiKey = localStorage.getItem("openai_api_key")
    const savedAiModel = localStorage.getItem("openai_model") || "gpt-4o"
    
    if (savedApiKey) setApiKey(savedApiKey)
    if (savedAiModel) {
      // 检查是否是预设模型之一
      const presetModels = [
        "gpt-4o", 
        "o3-mini", 
        "claude-3-7-sonnet-20250219", 
        "claude-3-7-sonnet-thinking", 
        "gemini-2.5-pro-exp-03-25", 
        "gemini-2.0-flash"
      ];
      
      if (presetModels.includes(savedAiModel)) {
        setAiModel(savedAiModel);
        setShowCustomModel(false);
      } else {
        setAiModel("custom");
        setCustomModel(savedAiModel);
        setShowCustomModel(true);
      }
    }
  }, [toast, router])

  // 处理模型变更
  const handleModelChange = (value: string) => {
    setAiModel(value);
    if (value === "custom") {
      setShowCustomModel(true);
    } else {
      setShowCustomModel(false);
    }
  }

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  // 保存用户信息
  const saveUserInfo = async () => {
    if (!userData) return;
    
    try {
      setSaving(true);
      
      // 获取当前会话
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "未登录",
          description: "请先登录后再保存信息",
          variant: "destructive",
        })
        return
      }
      
      // 通过API保存用户信息
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: formData.name,
          school: formData.school
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("保存用户数据失败:", data.error);
        toast({
          title: "保存失败",
          description: data.error || "无法更新您的个人信息",
          variant: "destructive",
        });
        return;
      }
      
      // 更新本地状态
      if (data.user) {
        setUserData(data.user);
      } else {
        setUserData((prev: any) => ({
          ...prev,
          name: formData.name,
          school: formData.school
        }));
      }
      
      toast({
        title: "保存成功",
        description: "您的个人信息已更新",
      });
    } catch (error) {
      console.error("保存用户信息出错:", error);
      toast({
        title: "保存失败",
        description: "更新个人信息时出现错误",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 保存API设置
  const saveApiSettings = () => {
    try {
      // 确定要保存的模型名称
      const modelToSave = aiModel === "custom" ? customModel : aiModel;
      
      // 验证自定义模型不为空
      if (aiModel === "custom" && !customModel.trim()) {
        toast({
          title: "保存失败",
          description: "请输入自定义模型名称",
          variant: "destructive",
        })
        return;
      }
      
      // 验证API Key不为空
      if (!apiKey.trim()) {
        toast({
          title: "保存失败",
          description: "请输入OpenAI API Key",
          variant: "destructive",
        })
        return;
      }
      
      localStorage.setItem("openai_api_key", apiKey)
      localStorage.setItem("openai_model", modelToSave)
      
      toast({
        title: "设置已保存",
        description: "您的API设置已成功保存",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: "设置保存时出现错误",
        variant: "destructive",
      })
    }
  }

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
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input 
                        id="email" 
                        value={formData.email} 
                        disabled 
                      />
                      <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">学校</Label>
                    <Input 
                      id="school" 
                      value={formData.school} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={saveUserInfo} disabled={loading || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : "保存更改"}
              </Button>
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
              <CardTitle>OpenAI API 设置</CardTitle>
              <CardDescription>
                配置您的 OpenAI API 密钥和模型以启用试卷解析和AI批改功能
                <div className="mt-2">
                  <Link 
                    href="https://chatwithai.icu" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    前往 ChatWithAI.icu 获取 API Key <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">OpenAI API Key</Label>
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder="sk-..." 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">您的API密钥将安全地存储在本地，不会被发送到我们的服务器</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-model">AI 模型</Label>
                <Select 
                  value={aiModel} 
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger id="ai-model">
                    <SelectValue placeholder="选择AI模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (推荐)</SelectItem>
                    <SelectItem value="o3-mini">o3-mini</SelectItem>
                    <SelectItem value="claude-3-7-sonnet-20250219">claude-3-7-sonnet-20250219</SelectItem>
                    <SelectItem value="claude-3-7-sonnet-thinking">claude-3-7-sonnet-thinking</SelectItem>
                    <SelectItem value="gemini-2.5-pro-exp-03-25">gemini-2.5-pro-exp-03-25</SelectItem>
                    <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                    <SelectItem value="custom">自定义模型</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showCustomModel && (
                <div className="space-y-2">
                  <Label htmlFor="custom-model">自定义模型名称</Label>
                  <Input 
                    id="custom-model" 
                    value={customModel} 
                    onChange={(e) => setCustomModel(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>API Base URL</Label>
                <Input 
                  value="https://chatwithai.icu/v1" 
                  readOnly 
                  disabled
                />
                <p className="text-sm text-muted-foreground">使用ChatWithAI.icu提供的代理服务，价格更优惠</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveApiSettings}>保存API设置</Button>
            </CardFooter>
          </Card>
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
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {userData?.role === 'admin' || userData?.role === 'teacher' ? (
                    <div className="space-y-4">
                      {/* 团队成员列表组件 */}
                      <TeamMembersList userData={userData} />
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>您没有管理团队的权限</p>
                      <p className="text-sm mt-1">只有教师和管理员可以管理团队成员</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              {(userData?.role === 'admin' || userData?.role === 'teacher') && (
                <Button variant="outline">邀请成员</Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 团队成员列表组件
function TeamMembersList({ userData }: { userData: any }) {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        setLoadingTeam(true)
        
        // 获取当前会话
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          toast({
            title: "未登录",
            description: "请先登录后再访问此功能",
            variant: "destructive",
          })
          return
        }
        
        // 使用API获取团队成员列表
        const response = await fetch('/api/users/list', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '获取用户列表失败');
        }
        
        const data = await response.json();
        
        if (data && data.users) {
          // 确保当前用户排在第一位
          const currentUser = data.users.find((user: any) => user.id === userData.id);
          const otherUsers = data.users.filter((user: any) => user.id !== userData.id);
          
          const sortedUsers = currentUser 
            ? [currentUser, ...otherUsers] 
            : otherUsers;
            
          setTeamMembers(sortedUsers);
        } else {
          setTeamMembers([])
        }
      } catch (error) {
        console.error("加载团队成员出错:", error);
        toast({
          title: "加载失败",
          description: error instanceof Error ? error.message : "获取团队成员时出现意外错误",
          variant: "destructive",
        });
        setTeamMembers([]);
      } finally {
        setLoadingTeam(false);
      }
    }
    
    if (userData) {
      fetchTeamMembers();
    }
  }, [userData, toast]);
  
  // 更新用户角色
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // 获取当前会话
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "未登录",
          description: "请先登录后再执行此操作",
          variant: "destructive",
        })
        return
      }
      
      // 通过API更新用户角色
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId,
          role: newRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新角色失败');
      }
      
      // 更新本地状态
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === userId ? {...member, role: newRole} : member
        )
      );
      
      toast({
        title: "更新成功",
        description: "用户角色已更新",
      });
    } catch (error) {
      console.error("更新用户角色出错:", error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新用户角色时发生错误",
        variant: "destructive",
      });
    }
  };
  
  if (loadingTeam) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>暂无团队成员数据</p>
        <p className="text-sm mt-1">您可以邀请成员加入您的团队</p>
      </div>
    )
  }
  
  return (
    <>
      {teamMembers.map((member) => (
        <div key={member.id} className="flex items-center justify-between">
          <div>
            <p className="font-medium">{member.name}</p>
            <p className="text-sm text-muted-foreground">
              {member.email} - {member.role === "teacher" ? "教师" : 
                              member.role === "student" ? "学生" : 
                              member.role === "admin" ? "管理员" : "未知"}
            </p>
          </div>
          {/* 只有管理员可以更改角色 */}
          {userData.role === 'admin' && member.id !== userData.id && (
            <Select 
              defaultValue={member.role} 
              onValueChange={(value) => updateUserRole(member.id, value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="student">学生</SelectItem>
              </SelectContent>
            </Select>
          )}
          {(userData.role !== 'admin' || member.id === userData.id) && (
            <div className="w-[120px] text-right text-sm text-muted-foreground">
              {member.id === userData.id ? "当前用户" : ""}
            </div>
          )}
        </div>
      ))}
    </>
  )
}
