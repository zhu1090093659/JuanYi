import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 受保护的路由列表
const protectedRoutes = ["/dashboard", "/student", "/exams", "/users", "/analytics", "/reports", "/settings"];

// 公开的认证相关路由（无需登录也可访问）
const publicAuthRoutes = ["/login", "/register", "/reset-password", "/forgot-password", "/auth/callback"];

export async function middleware(request: NextRequest) {
  // -- 添加日志 --
  console.log(`
--- Middleware START for path: ${request.nextUrl.pathname} ---`);

  try {
    // 获取NextAuth会话令牌
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log("🔑 会话状态:", token ? "已登录" : "未登录");

    const currentPath = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some((route) =>
      currentPath === route || currentPath.startsWith(`${route}/`)
    );
    console.log("🛡️ 是否为受保护路由:", isProtectedRoute);

    const isPublicAuthRoute = publicAuthRoutes.some((route) =>
      currentPath === route || currentPath.startsWith(`${route}/`)
    );
    console.log("🔓 是否为公开认证路由:", isPublicAuthRoute);

    // 如果是受保护的路由但用户未登录
    if (isProtectedRoute && !token) {
      console.log("🚫 访问受保护路由但未登录，重定向到登录页面");
      const redirectUrl = new URL('/login', request.url);
      // 添加callbackUrl，方便登录后返回原页面
      redirectUrl.searchParams.set("callbackUrl", encodeURI(request.url));
      // 返回一个新的重定向响应
      return NextResponse.redirect(redirectUrl);
    }

    // 如果用户已登录但尝试访问登录或注册页面
    if (isPublicAuthRoute && token) {
      console.log("✅ 已登录用户访问认证页面，重定向到仪表盘");
      const redirectUrl = new URL('/dashboard', request.url);
      // 返回一个新的重定向响应
      return NextResponse.redirect(redirectUrl);
    }

    // 如果不需要重定向，继续处理请求
    console.log("✓ 中间件执行完毕，无需重定向");
    // -- 添加日志 --
    console.log("--- Middleware END ---");
    return NextResponse.next();

  } catch (error) {
    console.error("❌ 中间件错误:", error);
    // 即使出错，也继续处理请求，避免完全中断
    // -- 添加日志 --
    console.log("--- Middleware END (due to error) ---");
    return NextResponse.next();
  }
}

// 配置中间件匹配的路径 - 排除静态资源和API路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * 1. /api 开头的路径 (API路由)
     * 2. /_next 开头的路径 (Next.js资源)
     * 3. /favicon.ico, /images/ 等静态资源
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
}; 