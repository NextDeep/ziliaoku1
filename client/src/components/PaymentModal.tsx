/**
 * 支付模态框组件
 * 用于展示支付方式选择和支付流程
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  // 是否显示模态框
  open: boolean;
  // 关闭模态框的回调
  onOpenChange: (open: boolean) => void;
  // 资料 ID
  resourceId: string;
  // 资料标题
  resourceTitle: string;
  // 支付金额（元）
  amount: number;
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

export function PaymentModal({
  open,
  onOpenChange,
  resourceId,
  resourceTitle,
  amount,
  paymentMethods,
  onCreateOrder,
  onPaymentSuccess,
}: PaymentModalProps) {
  // 当前选择的支付方式
  const [selectedMethod, setSelectedMethod] = useState<"alipay" | "wechat" | null>(null);
  // 是否正在加载
  const [loading, setLoading] = useState(false);
  // 当前订单信息
  const [orderInfo, setOrderInfo] = useState<{
    orderNo: string;
    qrCode?: string;
  } | null>(null);
  // 是否已复制订单号
  const [copied, setCopied] = useState(false);

  /**
   * 处理支付方式选择
   */
  const handleSelectMethod = async (method: "alipay" | "wechat") => {
    try {
      setLoading(true);
      setSelectedMethod(method);

      // 创建订单
      const order = await onCreateOrder(method);
      setOrderInfo({
        orderNo: order.orderNo,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          order.orderNo
        )}`,
      });
    } catch (error) {
      console.error("[Payment] Create order failed:", error);
      toast.error("创建订单失败，请重试");
      setSelectedMethod(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 验证支付
   */
  const verifyPayment = async () => {
    try {
      setLoading(true);
      
      // 调用后端验证支付接口
      const response = await fetch(`/api/trpc/payment.confirmPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'payment.confirmPayment',
          params: {
            input: {
              orderNo: orderInfo?.orderNo,
              transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
          },
          id: 1,
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || '支付验证失败');
      }

      return result.result.data;
    } catch (error) {
      console.error("[Payment] Verify payment failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 复制订单号
   */
  const handleCopyOrderNo = () => {
    if (orderInfo?.orderNo) {
      navigator.clipboard.writeText(orderInfo.orderNo);
      setCopied(true);
      toast.success("订单号已复制");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * 关闭模态框
   */
  const handleClose = () => {
    setSelectedMethod(null);
    setOrderInfo(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>支付资料</span>
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 资料信息 */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">资料标题</p>
            <p className="font-medium text-gray-900">{resourceTitle}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-600">支付金额</p>
              <p className="text-lg font-bold text-blue-600">¥{amount.toFixed(2)}</p>
            </div>
          </div>

          {/* 支付方式选择 */}
          {!selectedMethod ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">选择支付方式</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.type}
                    onClick={() => handleSelectMethod(method.type)}
                    disabled={loading}
                    className="rounded-lg border-2 border-gray-200 p-3 text-center transition-all hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <div className="text-2xl">{method.icon}</div>
                    <p className="mt-1 text-sm font-medium text-gray-900">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 支付流程
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {selectedMethod === "alipay" ? "支付宝支付" : "微信支付"}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">¥{amount.toFixed(2)}</p>
              </div>

              {/* 二维码显示 */}
              {orderInfo?.qrCode && (
                <div className="flex flex-col items-center space-y-2">
                  <div className="rounded-lg border border-gray-200 p-2">
                    <img
                      src={orderInfo.qrCode}
                      alt="支付二维码"
                      className="h-48 w-48"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    使用{selectedMethod === "alipay" ? "支付宝" : "微信"}扫描二维码支付
                  </p>
                </div>
              )}

              {/* 订单号 */}
              {orderInfo?.orderNo && (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                  <div>
                    <p className="text-xs text-gray-600">订单号</p>
                    <p className="font-mono text-sm text-gray-900">{orderInfo.orderNo}</p>
                  </div>
                  <button
                    onClick={handleCopyOrderNo}
                    className="rounded-md p-2 hover:bg-gray-200"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              )}

              {/* 支付提示 */}
              <div className="rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
                <p>• 支付完成后，内容将自动解锁</p>
                <p>• 如果长时间未到账，请检查订单号是否正确</p>
              </div>

              {/* 按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedMethod(null);
                    setOrderInfo(null);
                  }}
                  className="flex-1"
                >
                  返回
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await verifyPayment();
                      toast.success("支付成功！内容已解锁");
                      onPaymentSuccess?.();
                      handleClose();
                    } catch (error) {
                      toast.error("支付验证失败，请检查订单号是否正确或联系客服");
                      console.error("[Payment] Payment verification failed:", error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    "我已支付"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
