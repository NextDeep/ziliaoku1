/**
 * 支付系统集成测试
 * 测试支付订单创建、查询、支付确认等功能
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createPaymentOrder,
  getPaymentOrder,
  markPaymentAsPaid,
  createUserPurchase,
  checkUserPurchase,
} from "./db";

describe("Payment System", () => {
  describe("Payment Order Operations", () => {
    it("should create a payment order", async () => {
      // 创建支付订单
      const orderNo = `TEST-${Date.now()}`;
      const result = await createPaymentOrder({
        orderNo,
        resourceId: "resource-001",
        userId: 1,
        userEmail: "test@example.com",
        amount: 9900, // 99 元
        paymentMethod: "alipay",
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(result).toBeDefined();
    });

    it("should get a payment order by orderNo", async () => {
      // 创建订单
      const orderNo = `TEST-${Date.now()}`;
      await createPaymentOrder({
        orderNo,
        resourceId: "resource-001",
        userId: 1,
        userEmail: "test@example.com",
        amount: 9900,
        paymentMethod: "alipay",
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      // 查询订单
      const order = await getPaymentOrder(orderNo);
      expect(order).toBeDefined();
      expect(order?.orderNo).toBe(orderNo);
      expect(order?.status).toBe("pending");
      expect(order?.amount).toBe(9900);
    });

    it("should mark payment as paid", async () => {
      // 创建订单
      const orderNo = `TEST-${Date.now()}`;
      await createPaymentOrder({
        orderNo,
        resourceId: "resource-001",
        userId: 1,
        userEmail: "test@example.com",
        amount: 9900,
        paymentMethod: "alipay",
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      // 标记为已支付
      const transactionId = `TXN-${Date.now()}`;
      await markPaymentAsPaid(orderNo, transactionId);

      // 验证订单状态
      const order = await getPaymentOrder(orderNo);
      expect(order?.status).toBe("paid");
      expect(order?.transactionId).toBe(transactionId);
      expect(order?.paidAt).toBeDefined();
    });
  });

  describe("User Purchase Operations", () => {
    it("should create a user purchase record", async () => {
      // 创建订单
      const orderNo = `TEST-${Date.now()}`;
      await createPaymentOrder({
        orderNo,
        resourceId: "resource-001",
        userId: 1,
        userEmail: "test@example.com",
        amount: 9900,
        paymentMethod: "alipay",
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      // 获取订单 ID（这里假设返回了 ID）
      const order = await getPaymentOrder(orderNo);
      if (!order) throw new Error("Order not found");

      // 创建购买记录
      const result = await createUserPurchase({
        userId: 1,
        resourceId: "resource-001",
        paymentOrderId: order.id,
        price: 9900,
      });

      expect(result).toBeDefined();
    });

    it("should check if user has purchased a resource", async () => {
      // 创建订单
      const orderNo = `TEST-${Date.now()}`;
      await createPaymentOrder({
        orderNo,
        resourceId: "resource-002",
        userId: 2,
        userEmail: "test2@example.com",
        amount: 9900,
        paymentMethod: "wechat",
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      // 获取订单
      const order = await getPaymentOrder(orderNo);
      if (!order) throw new Error("Order not found");

      // 创建购买记录
      await createUserPurchase({
        userId: 2,
        resourceId: "resource-002",
        paymentOrderId: order.id,
        price: 9900,
      });

      // 检查购买状态
      const purchased = await checkUserPurchase(2, "resource-002");
      expect(purchased).toBe(true);

      // 检查未购买的资料
      const notPurchased = await checkUserPurchase(2, "resource-003");
      expect(notPurchased).toBe(false);
    });
  });

  describe("Payment Order Expiration", () => {
    it("should handle expired payment orders", async () => {
      // 创建已过期的订单
      const orderNo = `TEST-EXPIRED-${Date.now()}`;
      await createPaymentOrder({
        orderNo,
        resourceId: "resource-001",
        userId: 1,
        userEmail: "test@example.com",
        amount: 9900,
        paymentMethod: "alipay",
        status: "pending",
        expiresAt: new Date(Date.now() - 1000), // 已过期
      });

      // 查询订单
      const order = await getPaymentOrder(orderNo);
      expect(order).toBeDefined();
      expect(new Date() > order!.expiresAt).toBe(true);
    });
  });

  describe("Payment Methods", () => {
    it("should support alipay payment method", async () => {
      const orderNo = `TEST-ALIPAY-${Date.now()}`;
      await createPaymentOrder({
        orderNo,
        resourceId: "resource-001",
        userId: 1,
        userEmail: "test@example.com",
        amount: 9900,
        paymentMethod: "alipay",
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const order = await getPaymentOrder(orderNo);
      expect(order?.paymentMethod).toBe("alipay");
    });

    it("should support wechat payment method", async () => {
      const orderNo = `TEST-WECHAT-${Date.now()}`;
      await createPaymentOrder({
        orderNo,
        resourceId: "resource-001",
        userId: 1,
        userEmail: "test@example.com",
        amount: 9900,
        paymentMethod: "wechat",
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const order = await getPaymentOrder(orderNo);
      expect(order?.paymentMethod).toBe("wechat");
    });
  });
});
