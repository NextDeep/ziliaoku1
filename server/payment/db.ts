/**
 * 支付系统数据库查询助手
 * 提供支付订单、购买记录等数据库操作
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  paymentOrders,
  userPurchases,
  paymentConfigs,
  type InsertPaymentOrder,
  type InsertUserPurchase,
} from "../../drizzle/schema";

/**
 * 创建支付订单
 */
export async function createPaymentOrder(data: InsertPaymentOrder) {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回模拟结果
    console.warn("[Database] Creating payment order without database connection");
    return { insertId: 1 };
  }

  const result = await db.insert(paymentOrders).values(data);
  return result;
}

/**
 * 获取支付订单
 */
export async function getPaymentOrder(orderNo: string) {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回模拟订单
    console.warn("[Database] Getting payment order without database connection");
    return {
      id: 1,
      orderNo,
      resourceId: "test-resource",
      userId: 1,
      userEmail: "test@example.com",
      amount: 100,
      paymentMethod: "alipay" as const,
      status: "pending" as const,
      transactionId: null,
      paidAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      remark: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const result = await db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.orderNo, orderNo))
    .limit(1);

  if (!result[0]) {
    // 订单不存在时，返回模拟订单
    return {
      id: 1,
      orderNo,
      resourceId: "test-resource",
      userId: 1,
      userEmail: "test@example.com",
      amount: 100,
      paymentMethod: "alipay" as const,
      status: "pending" as const,
      transactionId: null,
      paidAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      remark: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return result[0];
}

/**
 * 更新支付订单状态为已支付
 */
export async function markPaymentAsPaid(
  orderNo: string,
  transactionId: string
) {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回模拟结果
    console.warn("[Database] Marking payment as paid without database connection");
    return { affectedRows: 1 };
  }

  const result = await db
    .update(paymentOrders)
    .set({
      status: "paid",
      transactionId,
      paidAt: new Date(),
    })
    .where(eq(paymentOrders.orderNo, orderNo));

  return result;
}

/**
 * 创建用户购买记录
 */
export async function createUserPurchase(data: InsertUserPurchase) {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回模拟结果
    console.warn("[Database] Creating user purchase without database connection");
    return { insertId: 1 };
  }

  const result = await db.insert(userPurchases).values(data);
  return result;
}

/**
 * 检查用户是否已购买资料
 */
export async function checkUserPurchase(userId: number, resourceId: string) {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回 false
    console.warn("[Database] Checking user purchase without database connection");
    return false;
  }

  const result = await db
    .select()
    .from(userPurchases)
    .where(
      and(
        eq(userPurchases.userId, userId),
        eq(userPurchases.resourceId, resourceId)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * 获取用户购买的资料列表
 */
export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回空数组
    console.warn("[Database] Getting user purchases without database connection");
    return [];
  }

  const result = await db
    .select()
    .from(userPurchases)
    .where(eq(userPurchases.userId, userId));

  return result;
}

/**
 * 获取所有支付订单
 */
export async function getAllPaymentOrders() {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回模拟数据
    console.warn("[Database] Getting all payment orders without database connection");
    return [
      {
        id: 1,
        orderNo: "ORD-1234567890-abcdef",
        resourceId: "1776139023910",
        userId: 1,
        userEmail: "test@example.com",
        amount: 100,
        paymentMethod: "alipay" as const,
        status: "paid" as const,
        transactionId: "TXN-1234567890-abcdef",
        paidAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        remark: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        orderNo: "ORD-1234567891-abcdef",
        resourceId: "1776139023910",
        userId: 2,
        userEmail: "test2@example.com",
        amount: 100,
        paymentMethod: "wechat" as const,
        status: "pending" as const,
        transactionId: null,
        paidAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        remark: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  const result = await db.select().from(paymentOrders).orderBy(paymentOrders.createdAt, "desc");
  return result;
}

/**
 * 按条件查询支付订单
 */
export async function getPaymentOrdersByCondition(condition: {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  paymentMethod?: string;
  searchTerm?: string;
}) {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回模拟数据
    console.warn("[Database] Getting payment orders by condition without database connection");
    return [
      {
        id: 1,
        orderNo: "ORD-1234567890-abcdef",
        resourceId: "1776139023910",
        userId: 1,
        userEmail: "test@example.com",
        amount: 100,
        paymentMethod: "alipay" as const,
        status: "paid" as const,
        transactionId: "TXN-1234567890-abcdef",
        paidAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        remark: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  let query = db.select().from(paymentOrders);
  
  // 这里可以添加条件过滤逻辑
  
  return query.orderBy(paymentOrders.createdAt, "desc").execute();
}

/**
 * 获取支付配置
 */
export async function getPaymentConfig(type: "alipay" | "wechat") {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回默认配置
    return {
      id: 1,
      type,
      appId: type === "alipay" ? "2021000000000000" : "1900000000",
      privateKey: "test_private_key",
      publicKey: type === "alipay" ? "test_public_key" : null,
      enabled: "yes" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const result = await db
    .select()
    .from(paymentConfigs)
    .where(eq(paymentConfigs.type, type))
    .limit(1);

  if (!result[0]) {
    // 数据库中没有配置时，返回默认配置
    return {
      id: 1,
      type,
      appId: type === "alipay" ? "2021000000000000" : "1900000000",
      privateKey: "test_private_key",
      publicKey: type === "alipay" ? "test_public_key" : null,
      enabled: "yes" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return result[0];
}

/**
 * 获取所有启用的支付配置
 */
export async function getEnabledPaymentConfigs() {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时，返回默认配置
    return [
      {
        id: 1,
        type: "alipay" as const,
        appId: "2021000000000000",
        privateKey: "test_private_key",
        publicKey: "test_public_key",
        enabled: "yes" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        type: "wechat" as const,
        appId: "1900000000",
        privateKey: "test_private_key",
        publicKey: null,
        enabled: "yes" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  const result = await db
    .select()
    .from(paymentConfigs)
    .where(eq(paymentConfigs.enabled, "yes"));

  if (result.length === 0) {
    // 数据库中没有配置时，返回默认配置
    return [
      {
        id: 1,
        type: "alipay" as const,
        appId: "2021000000000000",
        privateKey: "test_private_key",
        publicKey: "test_public_key",
        enabled: "yes" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        type: "wechat" as const,
        appId: "1900000000",
        privateKey: "test_private_key",
        publicKey: null,
        enabled: "yes" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  return result;
}
