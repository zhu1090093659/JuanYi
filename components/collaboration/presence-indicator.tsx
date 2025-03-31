"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase/client"

interface User {
  id: string
  name: string
  avatar?: string
}

interface PresenceIndicatorProps {
  examId: string
}

export function PresenceIndicator({ examId }: PresenceIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<User[]>([])

  useEffect(() => {
    // 初始化 Presence 频道
    const channel = supabase.channel(`exam:${examId}`)

    // 处理用户加入
    const handlePresenceJoin = (payload: any) => {
      const newUser = payload.newPresences[0]
      if (newUser) {
        setActiveUsers((prev) => {
          // 检查用户是否已存在
          if (prev.some((user) => user.id === newUser.user_id)) {
            return prev
          }
          return [
            ...prev,
            {
              id: newUser.user_id,
              name: newUser.user_name,
              avatar: newUser.user_avatar,
            },
          ]
        })
      }
    }

    // 处理用户离开
    const handlePresenceLeave = (payload: any) => {
      const leftUser = payload.leftPresences[0]
      if (leftUser) {
        setActiveUsers((prev) => prev.filter((user) => user.id !== leftUser.user_id))
      }
    }

    // 订阅 Presence 事件
    channel
      .on("presence", { event: "join" }, handlePresenceJoin)
      .on("presence", { event: "leave" }, handlePresenceLeave)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // 获取当前用户信息
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            // 获取用户详细信息
            const { data: profile } = await supabase.from("users").select("name").eq("id", userData.user.id).single()

            // 加入 Presence
            await channel.track({
              user_id: userData.user.id,
              user_name: profile?.name || "未知用户",
              user_avatar: null,
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    // 获取当前活跃用户
    const getActiveUsers = async () => {
      const presenceState = channel.presenceState()
      const users: User[] = []

      Object.values(presenceState).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          if (!users.some((user) => user.id === presence.user_id)) {
            users.push({
              id: presence.user_id,
              name: presence.user_name,
              avatar: presence.user_avatar,
            })
          }
        })
      })

      setActiveUsers(users)
    }

    getActiveUsers()

    return () => {
      channel.unsubscribe()
    }
  }, [examId])

  return (
    <div className="flex -space-x-2">
      <TooltipProvider>
        {activeUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-background">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {activeUsers.length > 0 && (
          <div className="flex items-center ml-2 text-sm text-muted-foreground">{activeUsers.length} 人在线</div>
        )}
      </TooltipProvider>
    </div>
  )
}

