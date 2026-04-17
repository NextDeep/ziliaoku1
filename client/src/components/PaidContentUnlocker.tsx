/**
 * 付费内容解锁组件
 * 用于展示需要支付才能查看的内容
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

interface PaidContentUnlockerProps {
  // 资料 ID
  resourceId: string;
  // 资料标题
  resourceTitle: string;
  // 支付金额（元）
  amount: number;
  // 是否已购买
  isPurchased: boolean;
  // 内容
  content: React.ReactNode;
  // 支付方式列表
  paymentMethods: Array<{
    type: "alipay" | "wechat";
    name: string;
    icon: string;
  }>;
  // 创建订单的回调
  onCreateOrder: (method: "alipay" | "wechat") => Promise<{
    orderNo: string;
    amount: number;
    paymentMethod: string;
  }>;
  // 支付成功的回调
  onPaymentSuccess?: () => void;
}

export function PaidContentUnlocker({
  resourceId,
  resourceTitle,
  amount,
  isPurchased,
  content,
  paymentMethods,
  onCreateOrder,
  onPaymentSuccess,
}: PaidContentUnlockerProps) {
  // 是否显示支付模态框
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // 如果已购买，直接显示内容
  if (isPurchased) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
          <Unlock className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">您已购买此资料，可以查看完整内容</span>
        </div>
        <div className="prose prose-sm max-w-none">{content}</div>
      </div>
    );
  }

  // 未购买时显示锁定状态
  return (
    <>
      <div className="space-y-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        {/* 锁定图标 */}
        <div className="flex justify-center">
          <div className="rounded-full bg-gray-200 p-4">
            <Lock className="h-8 w-8 text-gray-600" />
          </div>
        </div>

        {/* 提示文本 */}
        <div>
          <h3 className="font-semibold text-gray-900">此内容需要购买</h3>
          <p className="mt-1 text-sm text-gray-600">
            购买后即可查看完整的资料内容、下载链接等信息
          </p>
        </div>

        {/* 价格显示 */}
        <div className="text-center py-2">
          <span className="text-3xl font-bold text-blue-600">¥{amount.toFixed(2)}</span>
        </div>

        {/* 购买按钮 */}
        <Button
          onClick={() => setShowPaymentModal(true)}
          size="lg"
          className="w-full"
        >
          立即购买
        </Button>

        {/* 特性列表 */}
        <div className="space-y-2 border-t border-gray-200 pt-4 text-left">
          <p className="text-xs font-medium text-gray-700">购买后您将获得：</p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>✓ 完整的资料内容</li>
            <li>✓ 所有下载链接和资源</li>
            <li>✓ 永久访问权限</li>
            <li>✓ 后续更新内容</li>
          </ul>
        </div>
      </div>

      {/* 支付模态框 */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        resourceId={resourceId}
        resourceTitle={resourceTitle}
        amount={amount}
        paymentMethods={paymentMethods}
        onCreateOrder={onCreateOrder}
        onPaymentSuccess={() => {
          setShowPaymentModal(false);
          onPaymentSuccess?.();
        }}
      />
    </>
  );
}
