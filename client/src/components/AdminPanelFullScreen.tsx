/**
 * 全屏后台管理面板组件
 * 替代原有的弹窗式管理面板
 * 提供完整的内容管理界面
 */
import { useState, useCallback } from "react";
import { useResource, Resource, SidebarItem } from "@/contexts/ResourceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { AVAILABLE_ICONS, IconComponent } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Check, GripVertical, LogOut, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

// ===================== 常量定义 =====================

const TAG_COLORS = [
  { value: "blue", label: "蓝色", className: "bg-blue-400" },
  { value: "yellow", label: "黄色", className: "bg-yellow-400" },
  { value: "green", label: "绿色", className: "bg-green-500" },
  { value: "purple", label: "紫色", className: "bg-purple-400" },
  { value: "pink", label: "粉色", className: "bg-pink-400" },
  { value: "orange", label: "橙色", className: "bg-orange-400" },
  { value: "cyan", label: "青色", className: "bg-cyan-500" },
  { value: "red", label: "红色", className: "bg-red-400" },
  { value: "indigo", label: "靛蓝", className: "bg-indigo-400" },
  { value: "amber", label: "琥珀", className: "bg-amber-400" },
];

const FILE_TYPES = ["PDF", "ZIP", "DOC", "DOCX", "XLSX", "PPT", "PPTX", "MP4", "RAR", "OTHER"];

// ===================== 资料表单类型 =====================

interface ResourceFormData {
  title: string;
  description: string;
  image: string;
  downloadUrl: string;
  categoryId: string;
  tags: string[];
  fileSize: string;
  fileType: string;
  featured: boolean;
  content: string;
  pricing: {
    isFree: boolean;
    price: number;
  };
}

const EMPTY_RESOURCE_FORM: ResourceFormData = {
  title: "",
  description: "",
  image: "",
  downloadUrl: "",
  categoryId: "",
  tags: [],
  fileSize: "",
  fileType: "PDF",
  featured: false,
  content: "",
  pricing: {
    isFree: true,
    price: 0,
  },
};

// ===================== 资料编辑表单组件 =====================

function ResourceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<ResourceFormData>;
  onSave: (data: ResourceFormData) => void;
  onCancel: () => void;
}) {
  const { categories, tags } = useResource();
  const [form, setForm] = useState<ResourceFormData>({
    ...EMPTY_RESOURCE_FORM,
    ...initial,
  });

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">资料标题</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="输入资料标题"
            className="text-sm h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">分类</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-sm">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm">资料描述</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="输入资料描述"
          className="text-sm min-h-20"
        />
      </div>

      {/* 文件信息 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">文件类型</Label>
          <Select value={form.fileType} onValueChange={(v) => setForm({ ...form, fileType: v })}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {FILE_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-sm">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">文件大小</Label>
          <Input
            value={form.fileSize}
            onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
            placeholder="如: 15.2 MB"
            className="text-sm h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">下载链接</Label>
          <Input
            value={form.downloadUrl}
            onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
            placeholder="输入下载链接"
            className="text-sm h-9"
          />
        </div>
      </div>

      {/* 图片和标签 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">封面图片 URL</Label>
          <Input
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            placeholder="输入图片 URL"
            className="text-sm h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">标签</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  const newTags = form.tags.includes(tag.id)
                    ? form.tags.filter((t) => t !== tag.id)
                    : [...form.tags, tag.id];
                  setForm({ ...form, tags: newTags });
                }}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-all",
                  form.tags.includes(tag.id)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 付费配置 */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">免费资料</Label>
          <Switch
            checked={form.pricing.isFree}
            onCheckedChange={(checked) =>
              setForm({
                ...form,
                pricing: { ...form.pricing, isFree: checked },
              })
            }
          />
        </div>

        {!form.pricing.isFree && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">价格（元）</Label>
                <Input
                  type="number"
                  value={form.pricing.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pricing: { ...form.pricing, price: parseFloat(e.target.value) || 0 },
                    })
                  }
                  placeholder="0.00"
                  className="text-sm h-9"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 富文本内容 */}
      <div className="space-y-1">
        <Label className="text-sm">详情页内容（HTML）</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="输入 HTML 格式的详情内容"
          className="text-sm min-h-32 font-mono text-xs"
        />
      </div>

      {/* 精选推荐 */}
      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Switch
          checked={form.featured}
          onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
        />
        <Label className="text-sm font-medium text-yellow-900">标记为精选推荐</Label>
      </div>

      {/* 按钮 */}
      <div className="flex gap-2 pt-4">
        <Button onClick={() => onSave(form)} size="sm" className="flex-1 h-9 text-sm">
          保存
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm" className="flex-1 h-9 text-sm">
          取消
        </Button>
      </div>
    </div>
  );
}

// ===================== 主面板组件 =====================

export default function AdminPanelFullScreen() {
  const {
    resources, categories, tags, sidebarItems, siteConfig,
    addResource, updateResource, deleteResource,
    addCategory, updateCategory, deleteCategory,
    addTag, updateTag, deleteTag,
    addSidebarItem, updateSidebarItem, deleteSidebarItem,
    updateSiteConfig, getTagById, getCategoryById,
  } = useResource();
  const { logout, changeCredentials, getCurrentCredentials } = useAuth();
  const [, setLocation] = useLocation();

  // 编辑状态
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingSidebar, setEditingSidebar] = useState<string | null>(null);

  // 临时输入值
  const [tempName, setTempName] = useState("");
  const [tempIcon, setTempIcon] = useState("Folder");
  const [tempType, setTempType] = useState<SidebarItem["type"]>("custom");
  const [tempColor, setTempColor] = useState("blue");
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [addingSidebar, setAddingSidebar] = useState(false);

  // 网站配置编辑
  const [editingSiteConfig, setEditingSiteConfig] = useState(false);
  const [tempSiteConfig, setTempSiteConfig] = useState(siteConfig);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 右侧内容 */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="resources" className="w-full">
          <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-white px-8 h-14">
            <TabsTrigger value="resources" className="text-sm h-12 px-4 border-b-2 border-transparent data-[state=active]:border-gray-900">
              资料管理
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-sm h-12 px-4 border-b-2 border-transparent data-[state=active]:border-gray-900">
              分类管理
            </TabsTrigger>
            <TabsTrigger value="tags" className="text-sm h-12 px-4 border-b-2 border-transparent data-[state=active]:border-gray-900">
              标签管理
            </TabsTrigger>
            <TabsTrigger value="sidebar" className="text-sm h-12 px-4 border-b-2 border-transparent data-[state=active]:border-gray-900">
              侧边栏配置
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm h-12 px-4 border-b-2 border-transparent data-[state=active]:border-gray-900">
              网站设置
            </TabsTrigger>
          </TabsList>

          {/* ===== 资料管理 ===== */}
          <TabsContent value="resources" className="px-8 py-6 mt-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">资料管理</h2>
                <p className="text-sm text-gray-500 mt-1">共 {resources.length} 个资料</p>
              </div>
              <Button
                onClick={() => setEditingResource("new")}
                size="sm"
                className="h-9 text-sm"
              >
                <Plus size={14} className="mr-1.5" />
                添加资料
              </Button>
            </div>

            {editingResource === "new" && (
              <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200">
                <h3 className="text-base font-semibold mb-4">添加新资料</h3>
                <ResourceForm
                  onSave={(data) => {
                    addResource(data);
                    toast.success("✓ 资料已添加");
                    setEditingResource(null);
                  }}
                  onCancel={() => setEditingResource(null)}
                />
              </div>
            )}

            <div className="space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="p-4 bg-white rounded-lg border border-gray-200">
                  {editingResource === resource.id ? (
                    <ResourceForm
                      initial={resource}
                      onSave={(data) => {
                        updateResource(resource.id, data);
                        toast.success("✓ 资料已更新");
                        setEditingResource(null);
                      }}
                      onCancel={() => setEditingResource(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>{resource.fileType} • {resource.fileSize}</span>
                          <span>📥 {resource.downloads}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          onClick={() => setEditingResource(resource.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <Pencil size={12} className="mr-1" />
                          编辑
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm("确认删除该资料？")) {
                              deleteResource(resource.id);
                              toast.success("资料已删除");
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={12} className="mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ===== 分类管理 ===== */}
          <TabsContent value="categories" className="px-8 py-6 mt-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">分类管理</h2>
                <p className="text-sm text-gray-500 mt-1">共 {categories.length} 个分类</p>
              </div>
              <Button
                onClick={() => {
                  setTempName("新分类");
                  setTempIcon("Folder");
                  setAddingCategory(true);
                }}
                size="sm"
                className="h-9 text-sm"
              >
                <Plus size={14} className="mr-1.5" />
                添加分类
              </Button>
            </div>

            {addingCategory && (
              <div className="mb-6 p-6 bg-gray-100 rounded-xl border border-gray-300 space-y-4">
                <h3 className="text-base font-semibold">添加分类</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">分类名称</Label>
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">图标</Label>
                    <Select value={tempIcon} onValueChange={setTempIcon}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon} className="text-sm">
                            <span className="flex items-center gap-2">
                              <IconComponent name={icon} size={14} />
                              {icon}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!tempName.trim()) {
                        toast.error("请填写分类名称");
                        return;
                      }
                      addCategory({ name: tempName, icon: tempIcon, order: categories.length + 1 });
                      toast.success("✓ 分类已添加");
                      setAddingCategory(false);
                    }}
                    size="sm"
                    className="flex-1 h-9 text-sm"
                  >
                    保存
                  </Button>
                  <Button
                    onClick={() => setAddingCategory(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-sm"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 group">
                  {editingCategory === category.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="text-sm h-8 flex-1"
                      />
                      <Select value={tempIcon} onValueChange={setTempIcon}>
                        <SelectTrigger className="text-sm h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {AVAILABLE_ICONS.map((icon) => (
                            <SelectItem key={icon} value={icon} className="text-sm">
                              <span className="flex items-center gap-2">
                                <IconComponent name={icon} size={14} />
                                {icon}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => {
                          updateCategory(category.id, { name: tempName, icon: tempIcon });
                          toast.success("✓ 分类已更新");
                          setEditingCategory(null);
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <IconComponent name={category.icon} size={15} className="text-gray-500 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-900">{category.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setTempName(category.name);
                            setTempIcon(category.icon);
                            setEditingCategory(category.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("确认删除该分类？")) {
                              deleteCategory(category.id);
                              toast.success("分类已删除");
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ===== 标签管理 ===== */}
          <TabsContent value="tags" className="px-8 py-6 mt-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">标签管理</h2>
                <p className="text-sm text-gray-500 mt-1">共 {tags.length} 个标签</p>
              </div>
              <Button
                onClick={() => {
                  setTempName("新标签");
                  setTempColor("blue");
                  setAddingTag(true);
                }}
                size="sm"
                className="h-9 text-sm"
              >
                <Plus size={14} className="mr-1.5" />
                添加标签
              </Button>
            </div>

            {addingTag && (
              <div className="mb-6 p-6 bg-gray-100 rounded-xl border border-gray-300 space-y-4">
                <h3 className="text-base font-semibold">添加标签</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">标签名称</Label>
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">颜色</Label>
                    <Select value={tempColor} onValueChange={setTempColor}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAG_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value} className="text-sm">
                            <span className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color.className}`} />
                              {color.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!tempName.trim()) {
                        toast.error("请填写标签名称");
                        return;
                      }
                      addTag({ name: tempName, color: tempColor });
                      toast.success("✓ 标签已添加");
                      setAddingTag(false);
                    }}
                    size="sm"
                    className="flex-1 h-9 text-sm"
                  >
                    保存
                  </Button>
                  <Button
                    onClick={() => setAddingTag(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-sm"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 group">
                  {editingTag === tag.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="text-sm h-8 flex-1"
                      />
                      <Select value={tempColor} onValueChange={setTempColor}>
                        <SelectTrigger className="text-sm h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAG_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value} className="text-sm">
                              <span className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${color.className}`} />
                                {color.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => {
                          updateTag(tag.id, { name: tempName, color: tempColor });
                          toast.success("✓ 标签已更新");
                          setEditingTag(null);
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${TAG_COLORS.find((c) => c.value === tag.color)?.className || "bg-blue-400"}`} />
                      <span className="flex-1 text-sm text-gray-900">{tag.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setTempName(tag.name);
                            setTempColor(tag.color);
                            setEditingTag(tag.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("确认删除该标签？")) {
                              deleteTag(tag.id);
                              toast.success("标签已删除");
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ===== 侧边栏配置 ===== */}
          <TabsContent value="sidebar" className="px-8 py-6 mt-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">侧边栏配置</h2>
                <p className="text-sm text-gray-500 mt-1">共 {sidebarItems.length} 项导航</p>
              </div>
              <Button
                onClick={() => {
                  setTempName("新导航项");
                  setTempIcon("Folder");
                  setTempType("custom");
                  setAddingSidebar(true);
                }}
                size="sm"
                className="h-9 text-sm"
              >
                <Plus size={14} className="mr-1.5" />
                添加导航项
              </Button>
            </div>

            {addingSidebar && (
              <div className="mb-6 p-6 bg-gray-100 rounded-xl border border-gray-300 space-y-4">
                <h3 className="text-base font-semibold">添加导航项</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">显示文字</Label>
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">图标</Label>
                    <Select value={tempIcon} onValueChange={setTempIcon}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon} className="text-sm">
                            <span className="flex items-center gap-2">
                              <IconComponent name={icon} size={14} />
                              {icon}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">类型</Label>
                    <Select
                      value={tempType}
                      onValueChange={(v) => setTempType(v as SidebarItem["type"])}
                    >
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm">全部资料</SelectItem>
                        <SelectItem value="featured" className="text-sm">精选推荐</SelectItem>
                        <SelectItem value="custom" className="text-sm">自定义链接</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!tempName.trim()) {
                        toast.error("请填写导航项名称");
                        return;
                      }
                      addSidebarItem({
                        label: tempName,
                        icon: tempIcon,
                        type: tempType,
                        order: sidebarItems.length + 1,
                      });
                      toast.success("✓ 导航项已添加");
                      setAddingSidebar(false);
                    }}
                    size="sm"
                    className="flex-1 h-9 text-sm"
                  >
                    保存
                  </Button>
                  <Button
                    onClick={() => setAddingSidebar(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-sm"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {[...sidebarItems].sort((a, b) => a.order - b.order).map((item, index) => {
                const sortedItems = [...sidebarItems].sort((a, b) => a.order - b.order);
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 group"
                  >
                    {editingSidebar === item.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="text-sm h-8 flex-1"
                        />
                        <Select value={tempIcon} onValueChange={setTempIcon}>
                          <SelectTrigger className="text-sm h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {AVAILABLE_ICONS.map((icon) => (
                              <SelectItem key={icon} value={icon} className="text-sm">
                                <span className="flex items-center gap-2">
                                  <IconComponent name={icon} size={14} />
                                  {icon}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => {
                            updateSidebarItem(item.id, { label: tempName, icon: tempIcon });
                            toast.success("✓ 导航项已更新");
                            setEditingSidebar(null);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingSidebar(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                        <IconComponent name={item.icon} size={15} className="text-gray-500 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-900">{item.label}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {item.type}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* 向上移动按钮 */}
                          <button
                            onClick={() => {
                              if (index > 0) {
                                const prevItem = sortedItems[index - 1];
                                updateSidebarItem(item.id, { order: prevItem.order });
                                updateSidebarItem(prevItem.id, { order: item.order });
                                toast.success("✓ 已上移");
                              }
                            }}
                            disabled={index === 0}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-md"
                            title="向上移动"
                          >
                            <ChevronUp size={14} />
                          </button>
                          {/* 向下移动按钮 */}
                          <button
                            onClick={() => {
                              if (index < sortedItems.length - 1) {
                                const nextItem = sortedItems[index + 1];
                                updateSidebarItem(item.id, { order: nextItem.order });
                                updateSidebarItem(nextItem.id, { order: item.order });
                                toast.success("✓ 已下移");
                              }
                            }}
                            disabled={index === sortedItems.length - 1}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-md"
                            title="向下移动"
                          >
                            <ChevronDown size={14} />
                          </button>
                          {/* 编辑按钮 */}
                          <button
                            onClick={() => {
                              setTempName(item.label);
                              setTempIcon(item.icon);
                              setEditingSidebar(item.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* 删除按钮 */}
                          <button
                            onClick={() => {
                              if (confirm("确认删除该导航项？")) {
                                deleteSidebarItem(item.id);
                                toast.success("导航项已删除");
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ===== 网站设置 ===== */}
          <TabsContent value="settings" className="px-8 py-6 mt-0">
            <div className="max-w-2xl space-y-8">
              {/* 网站基本信息 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">网站基本信息</h2>
                {editingSiteConfig ? (
                  <div className="space-y-4 p-6 bg-white rounded-xl border border-gray-200">
                    <div className="space-y-1">
                      <Label className="text-sm">网站标题</Label>
                      <Input
                        value={tempSiteConfig.title}
                        onChange={(e) => setTempSiteConfig({ ...tempSiteConfig, title: e.target.value })}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Logo 文字</Label>
                      <Input
                        value={tempSiteConfig.logoText}
                        onChange={(e) => setTempSiteConfig({ ...tempSiteConfig, logoText: e.target.value })}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">副标题</Label>
                      <Input
                        value={tempSiteConfig.subtitle}
                        onChange={(e) => setTempSiteConfig({ ...tempSiteConfig, subtitle: e.target.value })}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">网站描述</Label>
                      <Textarea
                        value={tempSiteConfig.description}
                        onChange={(e) => setTempSiteConfig({ ...tempSiteConfig, description: e.target.value })}
                        className="text-sm min-h-20"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => {
                          updateSiteConfig(tempSiteConfig);
                          toast.success("✓ 网站设置已保存");
                          setEditingSiteConfig(false);
                        }}
                        size="sm"
                        className="flex-1 h-9 text-sm"
                      >
                        保存
                      </Button>
                      <Button
                        onClick={() => setEditingSiteConfig(false)}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-sm"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-6 bg-white rounded-xl border border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">网站标题</p>
                      <p className="text-base font-semibold text-gray-900 mt-1">{siteConfig.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Logo 文字</p>
                      <p className="text-base font-semibold text-gray-900 mt-1">{siteConfig.logoText}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">副标题</p>
                      <p className="text-base font-semibold text-gray-900 mt-1">{siteConfig.subtitle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">网站描述</p>
                      <p className="text-sm text-gray-700 mt-1">{siteConfig.description}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setTempSiteConfig(siteConfig);
                        setEditingSiteConfig(true);
                      }}
                      size="sm"
                      className="h-9 text-sm mt-4"
                    >
                      <Pencil size={14} className="mr-2" />
                      编辑
                    </Button>
                  </div>
                )}
              </div>

              {/* 登录凭证设置 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">登录凭证设置</h2>
                <div className="space-y-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">当前用户名</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">{getCurrentCredentials().username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">当前密码</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">••••••••</p>
                  </div>
                  <Button
                    onClick={() => {
                      const newUsername = prompt("请输入新的用户名:");
                      const newPassword = prompt("请输入新的密码:");
                      if (newUsername && newPassword) {
                        changeCredentials(newUsername, newPassword);
                        toast.success("✓ 登录凭证已更新");
                      }
                    }}
                    size="sm"
                    className="h-9 text-sm mt-4"
                  >
                    <Pencil size={14} className="mr-2" />
                    修改登录凭证
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
