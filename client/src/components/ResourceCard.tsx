/**
 * 资料卡片组件
 * 展示单个资料的矩形卡片，包含：
 * - 资料封面图片
 * - 文件类型、大小、下载次数信息
 * - 标题和描述文字
 * - 底部关键字标签（可点击跳转标签页）
 * - 精选标识（置顶推荐时显示）
 */
import { Resource, ResourceTag } from "@/contexts/ResourceContext";
import { useResource } from "@/contexts/ResourceContext";
import { useLocation } from "wouter";
import { Download, FileText, Star, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ===================== 标签颜色映射 =====================
const TAG_COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-400" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  green:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  pink:   { bg: "bg-pink-50",   text: "text-pink-700",   dot: "bg-pink-400" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  cyan:   { bg: "bg-cyan-50",   text: "text-cyan-700",   dot: "bg-cyan-500" },
  red:    { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-400" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
  gray:   { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400" },
};

function getTagColors(color: string) {
  return TAG_COLOR_MAP[color] || TAG_COLOR_MAP.gray;
}

function formatDownloads(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

// ===================== 子组件 =====================

/** 标签徽章组件 */
function TagBadge({ tag, onClick }: { tag: ResourceTag; onClick: () => void }) {
  const colors = getTagColors(tag.color);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
        "transition-all duration-150 hover:shadow-md",
        colors.bg,
        colors.text
      )}
    >
      {/* 标签图标 */}
      <TagIcon size={12} className="flex-shrink-0" />
      {tag.name}
    </button>
  );
}

// ===================== 主组件 =====================

interface ResourceCardProps {
  resource: Resource;
  onTagClick?: (tagId: string) => void;
}

export default function ResourceCard({ resource, onTagClick }: ResourceCardProps) {
  const { getTagById } = useResource();
  const [, setLocation] = useLocation();

  /** 处理卡片点击，跳转到详情页 */
  const handleCardClick = () => {
    setLocation(`/resource/${resource.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        // 卡片基础样式
        "flex flex-col bg-white rounded-xl",
        "border border-gray-100 hover:border-gray-200",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        "transition-all duration-200 hover:-translate-y-0.5",
        "overflow-hidden cursor-pointer"
      )}
    >
      {/* ===== 精选标识 ===== */}
      {resource.featured && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="flex items-center gap-1 bg-amber-400 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">
            <Star size={10} fill="currentColor" />
            精选
          </div>
        </div>
      )}

      {/* ===== 封面图片区域 ===== */}
      <div className="relative w-full overflow-hidden bg-gray-50" style={{ aspectRatio: "16/9" }}>
        {resource.image && (
          <img
            src={resource.image}
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
            loading="lazy"
          />
        )}
      </div>

      {/* ===== 内容区域 ===== */}
      <div className="flex flex-col flex-1 p-3.5">
        {/* 文件元信息行 */}
        <div className="flex items-center gap-1.5 mb-2">
          {/* 文件类型 */}
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <FileText size={11} />
            <span className="font-mono font-semibold text-gray-500 tracking-wide">
              {resource.fileType}
            </span>
          </span>
          <span className="text-gray-200 text-xs">·</span>
          {/* 文件大小 */}
          <span className="text-xs text-gray-400">{resource.fileSize}</span>
          <span className="text-gray-200 text-xs">·</span>
          {/* 下载次数 */}
          <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
            <Download size={10} />
            {formatDownloads(resource.downloads)}
          </span>
        </div>

        {/* 资料标题 */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2">
          {resource.title}
        </h3>

        {/* 资料描述 */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-3">
          {resource.description}
        </p>

        {/* ===== 标签区域 ===== */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-gray-50">
            {resource.tags.map((tagId) => {
              const tag = getTagById(tagId);
              if (!tag) return null;
              return (
                <TagBadge
                  key={tagId}
                  tag={tag}
                  onClick={() => onTagClick?.(tagId)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
