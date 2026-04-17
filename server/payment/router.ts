/**
 * 支付系统 tRPC 路由
 * 提供支付订单创建、查询、验证等接口
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { nanoid } from "nanoid";
import {
  createPaymentOrder,
  getPaymentOrder,
  markPaymentAsPaid,
  createUserPurchase,
  checkUserPurchase,
  getPaymentConfig,
  getAllPaymentOrders,
  getPaymentOrdersByCondition,
} from "./db";

/**
 * 支付路由
 */
export const paymentRouter = router({
  /**
   * 创建支付订单
   * 用户点击"购买"时调用此接口
   */
  createOrder: publicProcedure
    .input(
      z.object({
        resourceId: z.string(),
        amount: z.number().positive(), // 金额，单位：元
        paymentMethod: z.enum(["alipay", "wechat"]),
        userEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 生成唯一的订单号
        const orderNo = `ORD-${Date.now()}-${nanoid(8)}`;

        // 转换金额为分（支付宝/微信的最小单位）
        const amountInCents = Math.round(input.amount * 100);

        // 计算订单过期时间（15分钟后）
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // 创建支付订单
        await createPaymentOrder({
          orderNo,
          resourceId: input.resourceId,
          userId: ctx.user?.id,
          userEmail: input.userEmail || ctx.user?.email,
          amount: amountInCents,
          paymentMethod: input.paymentMethod,
          status: "pending",
          expiresAt,
        });

        // 获取支付配置
        const paymentConfig = await getPaymentConfig(input.paymentMethod);
        if (!paymentConfig || paymentConfig.enabled !== "yes") {
          throw new Error(
            `Payment method ${input.paymentMethod} is not configured`
          );
        }

        return {
          orderNo,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          expiresAt,
        };
      } catch (error) {
        console.error("[Payment] Create order failed:", error);
        throw error;
      }
    }),

  /**
   * 查询订单状态
   */
  getOrder: publicProcedure
    .input(z.object({ orderNo: z.string() }))
    .query(async ({ input }) => {
      try {
        const order = await getPaymentOrder(input.orderNo);
        if (!order) {
          throw new Error("Order not found");
        }

        return {
          orderNo: order.orderNo,
          status: order.status,
          amount: order.amount / 100, // 转换回元
          paymentMethod: order.paymentMethod,
          paidAt: order.paidAt,
          expiresAt: order.expiresAt,
        };
      } catch (error) {
        console.error("[Payment] Get order failed:", error);
        throw error;
      }
    }),

  /**
   * 验证支付（模拟支付成功）
   * 在实际应用中，这应该由支付宝/微信的异步通知触发
   */
  confirmPayment: publicProcedure
    .input(
      z.object({
        orderNo: z.string(),
        transactionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 获取订单
        const order = await getPaymentOrder(input.orderNo);
        if (!order) {
          throw new Error("Order not found");
        }

        if (order.status !== "pending") {
          throw new Error("Order is not in pending status");
        }

        // 检查订单是否已过期
        if (new Date() > order.expiresAt) {
          throw new Error("Order has expired");
        }

        // 标记订单为已支付
        await markPaymentAsPaid(input.orderNo, input.transactionId);

        // 如果用户已登录，创建购买记录
        if (ctx.user) {
          await createUserPurchase({
            userId: ctx.user.id,
            resourceId: order.resourceId,
            paymentOrderId: order.id,
            price: order.amount,
          });
        }

        return {
          success: true,
          message: "Payment confirmed successfully",
        };
      } catch (error) {
        console.error("[Payment] Confirm payment failed:", error);
        throw error;
      }
    }),

  /**
   * 检查用户是否已购买资料
   */
  checkPurchase: publicProcedure
    .input(z.object({ resourceId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          return { purchased: false };
        }

        const purchased = await checkUserPurchase(ctx.user.id, input.resourceId);
        return { purchased };
      } catch (error) {
        console.error("[Payment] Check purchase failed:", error);
        throw error;
      }
    }),

  /**
   * 获取支付方式列表
   */
  getPaymentMethods: publicProcedure.query(async () => {
    try {
      const methods = [];

      // 检查支付宝是否启用
      const alipayConfig = await getPaymentConfig("alipay");
      if (alipayConfig?.enabled === "yes") {
        methods.push({
          type: "alipay",
          name: "支付宝",
          icon: "💳",
        });
      }

      // 检查微信是否启用
      const wechatConfig = await getPaymentConfig("wechat");
      if (wechatConfig?.enabled === "yes") {
        methods.push({
          type: "wechat",
          name: "微信支付",
          icon: "💚",
        });
      }

      return methods;
    } catch (error) {
      console.error("[Payment] Get payment methods failed:", error);
      return [];
    }
  }),

  /**
   * 获取支付订单列表
   */
  getPaymentOrders: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.string().optional(),
        paymentMethod: z.string().optional(),
        searchTerm: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const condition = {
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          status: input.status,
          paymentMethod: input.paymentMethod,
          searchTerm: input.searchTerm,
        };

        const orders = await getPaymentOrdersByCondition(condition);
        return orders;
      } catch (error) {
        console.error("[Payment] Get payment orders failed:", error);
        throw error;
      }
    }),

  /**
   * 获取所有支付订单
   */
  getAllPaymentOrders: publicProcedure.query(async () => {
    try {
      const orders = await getAllPaymentOrders();
      return orders;
    } catch (error) {
      console.error("[Payment] Get all payment orders failed:", error);
      throw error;
    }
  }),
});
