/**
 * 主内容区组件
 * 包含：
 * - 顶部导航栏（Logo + 搜索框 + 排序 + 筛选）
 * - 页面标题和资料统计
 * - 资料卡片网格（响应式3-4-5列）
 * - 空状态提示
 * - 筛选面板（可展开/收起）
 * - 无限滚动加载功能
 */
import { useResource } from "@/contexts/ResourceContext";
import ResourceCard from "./ResourceCard";
import { Search, X, SlidersHorizontal, ArrowUpDown, Home } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// 排序类型定义
type SortType = "default" | "downloads" | "date" | "size";

interface SortOption {
  value: SortType;
  label: string;
  icon: React.ReactNode;
}

export default function MainContent() {
  const {
    siteConfig,
    categories,
    tags,
    activeCategory,
    activeTag,
    searchQuery,
    setActiveCategory,
    setActiveTag,
    setSearchQuery,
    getFilteredResources,
    getTagById,
    getCategoryById,
  } = useResource();

  const [showFilters, setShowFilters] = useState(false);  // 筛选面板显示状态
  const [sortType, setSortType] = useState<SortType>("default");  // 排序类型
  const [displayCount, setDisplayCount] = useState(20);  // 显示的资料数量（用于无限滚动）
  const observerTarget = useRef<HTMLDivElement>(null);  // 无限滚动观察目标

  const filteredResources = getFilteredResources();

  // 排序选项
  const sortOptions: SortOption[] = [
    { value: "default", label: "默认排序", icon: "◆" },
    { value: "downloads", label: "下载量", icon: "↓" },
    { value: "date", label: "发布时间", icon: "⏰" },
    { value: "size", label: "文件大小", icon: "📦" },
  ];

  /** 对资料进行排序 */
  const getSortedResources = useCallback((resources: typeof filteredResources) => {
    const sorted = [...resources];
    switch (sortType) {
      case "downloads":
        return sorted.sort((a, b) => b.downloads - a.downloads);
      case "date":
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "size":
        // 尝试解析文件大小并排序
        return sorted.sort((a, b) => {
          const parseSize = (str: string) => {
            const match = str.match(/(\d+\.?\d*)\s*(MB|KB|GB)/i);
            if (!match) return 0;
            const num = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            if (unit === "GB") return num * 1024;
            if (unit === "MB") return num;
            if (unit === "KB") return num / 1024;
            return 0;
          };
          return parseSize(b.fileSize) - parseSize(a.fileSize);
        });
      default:
        return sorted;
    }
  }, [sortType]);

  const sortedResources = getSortedResources(filteredResources);
  const displayedResources = sortedResources.slice(0, displayCount);  // 只显示前 displayCount 个资料

  // 无限滚动效果
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < sortedResources.length) {
          // 当用户滚动到底部时，增加显示数量
          setDisplayCount((prev) => Math.min(prev + 10, sortedResources.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [displayCount, sortedResources.length]);

  // 当筛选条件改变时，重置显示数量
  useEffect(() => {
    setDisplayCount(20);
  }, [activeCategory, activeTag, searchQuery, sortType]);

  /** 获取当前页面标题 */
  const getPageTitle = useCallback((): string => {
    if (activeTag) {
      const tag = getTagById(activeTag);
      return tag ? `# ${tag.name}` : "标签筛选";
    }
    if (activeCategory === "featured") return "精选推荐";
    if (activeCategory === null) return "全部资料";
    const category = getCategoryById(activeCategory);
    return category ? category.name : "资料列表";
  }, [activeCategory, activeTag, getTagById, getCategoryById]);

  /** 处理标签点击（从卡片点击标签，跳转到标签聚合页） */
  const handleTagClick = useCallback((tagId: string) => {
    setActiveTag(tagId);
    setActiveCategory(null);
  }, [setActiveTag, setActiveCategory]);

  /** 清除所有筛选条件 */
  const clearFilters = useCallback(() => {
    setActiveCategory(null);
    setActiveTag(null);
    setSearchQuery("");
  }, [setActiveCategory, setActiveTag, setSearchQuery]);

  /** 是否有激活的筛选条件 */
  const hasActiveFilters = activeCategory !== null || activeTag !== null || searchQuery.trim() !== "";

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-[#F7F7F7] min-h-screen">
      {/* ===== 顶部导航栏（固定定位） ===== */}
      <header className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-6 h-16 flex items-center justify-center">
        <div className="flex items-center gap-2 flex-1 max-w-4xl">
          {/* 主页按钮 */}
          <a
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
            title="返回主页"
          >
            <Home size={16} />
          </a>

          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="搜索资料..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-9 pr-8 py-2 text-sm",
                "bg-white border border-gray-300 rounded-lg",
                "placeholder-gray-400 text-gray-900",
                "focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400",
                "transition-all duration-150"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 排序按钮 */}
          <div className="relative group">
            <button
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-150",
                sortType !== "default"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900"
              )}
              title="排序"
              onClick={(e) => e.currentTarget.focus()}
            >
              <ArrowUpDown size={14} />
            </button>
            {/* 排序下拉菜单 */}
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 min-w-[120px] z-50">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortType(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    sortType === option.value
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-150",
              showFilters
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900"
            )}
            title="筛选"
          >
            <SlidersHorizontal size={14} />
          </button>

          {/* 清除筛选按钮 */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="清除筛选"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* ===== 筛选面板（可展开） ===== */}
      {showFilters && (
        <div className="bg-white border-b border-gray-100 px-6 py-4 space-y-3">
          {/* 分类筛选 */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">分类</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setActiveCategory(null); setActiveTag(null); }}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-all duration-150",
                  activeCategory === null && !activeTag
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                )}
              >
                全部
              </button>
              <button
                onClick={() => { setActiveCategory("featured"); setActiveTag(null); }}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-all duration-150",
                  activeCategory === "featured"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700"
                )}
              >
                ⭐ 精选
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setActiveTag(null); }}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition-all duration-150",
                    activeCategory === cat.id
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">标签</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setActiveTag(activeTag === tag.id ? null : tag.id);
                    setActiveCategory(null);
                  }}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition-all duration-150",
                    activeTag === tag.id
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                  )}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 页面主体内容 ===== */}
      <div className="flex-1 px-6 py-5">
        {/* 页面标题栏 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 leading-none">
              {getPageTitle()}
            </h1>
            {/* 标签筛选时显示取消按钮 */}
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="ml-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
              >
                <X size={12} />
                取消
              </button>
            )}
          </div>
          {/* 资料数量统计 */}
          <span className="text-xs text-gray-400">
            {sortedResources.length} 个资料
          </span>
        </div>

        {/* ===== 资料卡片网格 ===== */}
        {sortedResources.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {displayedResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onTagClick={handleTagClick}
                />
              ))}
            </div>
            {/* 无限滚动加载指示器 */}
            {displayCount < sortedResources.length && (
              <div ref={observerTarget} className="flex justify-center py-8">
                <div className="text-sm text-gray-400">加载中...</div>
              </div>
            )}
          </>
        ) : (
          /* ===== 空状态提示 ===== */
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Search size={22} className="text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1.5">暂无相关资料</h3>
            <p className="text-sm text-gray-400 mb-5 max-w-xs">
              {searchQuery
                ? `没有找到与"${searchQuery}"相关的资料，请尝试其他关键词`
                : "该分类下暂无资料，请选择其他分类查看"}
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              查看全部资料
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
