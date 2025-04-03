import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="font-bold text-xl mr-6">
          卷知
        </Link>
        <MainNav />
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}

