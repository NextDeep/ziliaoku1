/**
 * 应用根组件
 * 配置全局 Provider、主题、路由
 */
import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ResourceProvider } from "./contexts/ResourceContext";
import { AuthProvider } from "./contexts/AuthContext";

// 懒加载页面组件
const Home = lazy(() => import("./pages/Home"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

/** 路由配置 */
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Switch>
        {/* 主页 - 资料展示页 */}
        <Route path={"/"} component={Home} />
        {/* 资料详情页 */}
        <Route path={"/resource/:id"} component={ResourceDetail} />
        {/* 后台管理登录页 */}
        <Route path={"/admin-panel-secure-2024/login"} component={AdminLogin} />
        {/* 后台管理仪表板 */}
        <Route path={"/admin-panel-secure-2024"} component={AdminDashboard} />
        {/* 404 页面 */}
        <Route path={"/404"} component={NotFound} />
        {/* 兜底路由 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

/** 应用根组件 */
function App() {
  return (
    <ErrorBoundary>
      {/* 认证 Provider - 管理后台管理员登录状态 */}
      <AuthProvider>
        {/* 主题 Provider - 使用浅色主题 */}
        <ThemeProvider defaultTheme="light">
          {/* 资料数据 Provider - 管理所有资料状态 */}
          <ResourceProvider>
            <TooltipProvider>
              {/* 全局 Toast 通知 */}
              <Toaster position="top-right" />
              <Router />
            </TooltipProvider>
          </ResourceProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
