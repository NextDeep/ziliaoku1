import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 支付订单表
 * 记录所有支付交易信息
 */
export const paymentOrders = mysqlTable("payment_orders", {
  id: int("id").autoincrement().primaryKey(),
  // 订单号（唯一标识）
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(),
  // 资料 ID
  resourceId: varchar("resourceId", { length: 64 }).notNull(),
  // 用户 ID（可选，未登录用户为 null）
  userId: int("userId"),
  // 用户邮箱（用于标识未登录用户）
  userEmail: varchar("userEmail", { length: 320 }),
  // 支付金额（单位：分）
  amount: int("amount").notNull(),
  // 支付方式：alipay（支付宝）、wechat（微信）
  paymentMethod: mysqlEnum("paymentMethod", ["alipay", "wechat"]).notNull(),
  // 订单状态：pending（待支付）、paid（已支付）、failed（支付失败）、expired（已过期）
  status: mysqlEnum("status", ["pending", "paid", "failed", "expired"]).default("pending").notNull(),
  // 第三方支付交易号
  transactionId: varchar("transactionId", { length: 128 }),
  // 支付时间
  paidAt: timestamp("paidAt"),
  // 过期时间（15分钟后过期）
  expiresAt: timestamp("expiresAt").notNull(),
  // 备注
  remark: text("remark"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrders.$inferInsert;

/**
 * 用户购买记录表
 * 记录用户已购买的资料
 */
export const userPurchases = mysqlTable("user_purchases", {
  id: int("id").autoincrement().primaryKey(),
  // 用户 ID
  userId: int("userId").notNull(),
  // 资料 ID
  resourceId: varchar("resourceId", { length: 64 }).notNull(),
  // 关联的支付订单
  paymentOrderId: int("paymentOrderId").notNull(),
  // 购买价格（单位：分）
  price: int("price").notNull(),
  // 购买时间
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertUserPurchase = typeof userPurchases.$inferInsert;

/**
 * 支付配置表
 * 存储支付宝和微信支付的配置信息
 */
export const paymentConfigs = mysqlTable("payment_configs", {
  id: int("id").autoincrement().primaryKey(),
  // 配置类型：alipay、wechat
  type: mysqlEnum("type", ["alipay", "wechat"]).notNull().unique(),
  // 支付宝：应用 ID；微信：商户 ID
  appId: varchar("appId", { length: 128 }).notNull(),
  // 支付宝：应用私钥；微信：API 密钥
  privateKey: text("privateKey").notNull(),
  // 支付宝：支付宝公钥；微信：（可选）
  publicKey: text("publicKey"),
  // 是否启用
  enabled: mysqlEnum("enabled", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentConfig = typeof paymentConfigs.$inferSelect;
export type InsertPaymentConfig = typeof paymentConfigs.$inferInsert;