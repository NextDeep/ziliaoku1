/**
 * 侧边栏组件
 * 仿照 manus.im 风格的左侧导航栏
 * 特点：
 * - 白色背景，右侧细边框
 * - Logo 区域（图标 + 文字）
 * - 图标 + 文字的导航菜单项
 * - 激活状态高亮（浅灰背景）
 * - 可折叠（仅显示图标）
 * - 底部管理入口
 */
import { cn } from "@/lib/utils";
import { useResource, SidebarItem } from "@/contexts/ResourceContext";
import { IconComponent } from "@/lib/iconMap";
import { Settings, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Sidebar() {
  const { sidebarItems, siteConfig, activeCategory, setActiveCategory, setActiveTag } = useResource();
  const [collapsed, setCollapsed] = useState(false);  // 侧边栏折叠状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);  // 移动设备标识
  const [, setLocation] = useLocation();

  // 监听窗口大小变化，自动切换移动端状态
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // 在移动设备上自动折叠侧边栏
      if (mobile) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 按 order 字段排序侧边栏项目
  const sortedItems = [...sidebarItems].sort((a, b) => a.order - b.order);

  /** 处理导航项点击 */
  const handleNavClick = (item: SidebarItem) => {
    setActiveTag(null);  // 清除标签筛选
    if (item.type === "all") {
      setActiveCategory(null);
      setLocation("/");
    } else if (item.type === "featured") {
      setActiveCategory("featured");
      setLocation("/");
    } else if (item.type === "category" && item.categoryId) {
      setActiveCategory(item.categoryId);
      setLocation("/");
    } else if (item.type === "custom" && item.url) {
      window.open(item.url, "_blank");
    }
  };

  /** 判断导航项是否处于激活状态 */
  const isActive = (item: SidebarItem): boolean => {
    if (item.type === "all") return activeCategory === null;
    if (item.type === "featured") return activeCategory === "featured";
    if (item.type === "category") return activeCategory === item.categoryId;
    return false;
  };

  return (
    <aside
      className={cn(
        // 侧边栏基础样式
        "flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex-shrink-0 relative",
        // 移动设备上默认折叠，桌面设备上根据 collapsed 状态决定
        isMobile || collapsed ? "w-[56px]" : "w-[220px]"
      )}
    >
      {/* 侧边栏折叠控制按钮 - 固定在右侧中间位置 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors z-10"
        title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ===== Logo 区域 ===== */}
      <div
        className={cn(
          "flex items-center h-[52px] border-b border-gray-100 flex-shrink-0",
          collapsed ? "px-3 justify-center" : "px-4"
        )} style={{height: '56px'}}
      >
        {/* Logo 图标 + 文字 */}
        <div className={cn("flex items-center gap-2.5 min-w-0", collapsed && "justify-center")}>
          {/* Logo 图标 */}
          <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0">
            <BookOpen size={13} className="text-white" />
          </div>
          {/* Logo 文字（折叠时隐藏） */}
          {!collapsed && (
            <span className="font-semibold text-gray-900 text-[13px] truncate leading-none" style={{fontSize: '18px'}}>
              {siteConfig.logoText}
            </span>
          )}
        </div>
      </div>

      {/* ===== 导航菜单区域 ===== */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">

        {/* 导航菜单项 */}
        {sortedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={cn(
              // 导航项基础样式
              "w-full flex items-center rounded-lg text-[13px] transition-all duration-150 mb-0.5",
              collapsed
                ? "justify-center p-2.5"
                : "justify-start gap-2.5 px-2.5 py-2",
              isActive(item)
                ? "bg-gray-100 text-gray-900 font-medium"   // 激活状态
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"  // 默认状态
            )}
            title={collapsed ? item.label : undefined}
          >
            {/* 导航图标 */}
            <IconComponent
              name={item.icon}
              size={15}
              className={cn(
                "flex-shrink-0",
                isActive(item) ? "text-gray-900" : "text-gray-400"
              )}
            />
            {/* 导航文字（折叠时隐藏） */}
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </button>
        ))}
      </nav>


    </aside>
  );
}
