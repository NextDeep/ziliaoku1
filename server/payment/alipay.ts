/**
 * 支付宝支付接口集成模块
 * 支持支付宝当面付、扫码支付等功能
 */
import crypto from "crypto";

/**
 * 支付宝支付配置
 */
export interface AlipayConfig {
  appId: string;
  privateKey: string;
  publicKey: string;
  notifyUrl: string;
  returnUrl: string;
  // 沙箱模式（测试环境）
  sandbox?: boolean;
}

/**
 * 支付宝订单参数
 */
export interface AlipayOrderParams {
  // 商户订单号（唯一）
  outTradeNo: string;
  // 订单标题
  subject: string;
  // 订单描述
  body?: string;
  // 订单总金额（单位：元）
  totalAmount: number;
  // 超时时间（如 15m）
  timeoutExpress?: string;
}

/**
 * 支付宝响应结果
 */
export interface AlipayResponse {
  code: string;
  msg: string;
  [key: string]: any;
}

/**
 * 支付宝支付类
 */
export class AlipayClient {
  private config: AlipayConfig;
  private apiUrl: string;

  constructor(config: AlipayConfig) {
    this.config = config;
    // 沙箱环境 URL
    this.apiUrl = config.sandbox
      ? "https://openapi.alipaydev.com/gateway.do"
      : "https://openapi.alipay.com/gateway.do";
  }

  /**
   * 生成支付宝支付二维码
   * 返回支付宝页面 URL，用户可以扫描二维码支付
   */
  async createQRCodePayment(params: AlipayOrderParams): Promise<string> {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: "QRCODE",
      total_amount: params.totalAmount.toFixed(2),
      subject: params.subject,
      body: params.body || "",
      timeout_express: params.timeoutExpress || "15m",
    };

    const requestParams: Record<string, string> = {
      app_id: this.config.appId,
      method: "alipay.trade.precreate",
      format: "JSON",
      return_url: this.config.returnUrl,
      notify_url: this.config.notifyUrl,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      version: "1.0",
      sign_type: "RSA2",
      charset: "utf-8",
      biz_content: JSON.stringify(bizContent),
    };

    // 生成签名
    const sign = this.sign(requestParams);
    requestParams.sign = sign;

    // 构建支付 URL
    const queryString = Object.entries(requestParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");

    return `${this.apiUrl}?${queryString}`;
  }

  /**
   * 生成支付宝页面支付 URL
   * 用户点击链接跳转到支付宝支付页面
   */
  async createPagePayment(params: AlipayOrderParams): Promise<string> {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: params.totalAmount.toFixed(2),
      subject: params.subject,
      body: params.body || "",
      timeout_express: params.timeoutExpress || "15m",
      return_url: this.config.returnUrl,
    };

    const requestParams: Record<string, string> = {
      app_id: this.config.appId,
      method: "alipay.trade.page.pay",
      format: "JSON",
      notify_url: this.config.notifyUrl,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      version: "1.0",
      sign_type: "RSA2",
      charset: "utf-8",
      biz_content: JSON.stringify(bizContent),
    };

    // 生成签名
    const sign = this.sign(requestParams);
    requestParams.sign = sign;

    // 构建支付 URL
    const queryString = Object.entries(requestParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");

    return `${this.apiUrl}?${queryString}`;
  }

  /**
   * 验证支付宝异步通知签名
   */
  verifyNotify(params: Record<string, string>): boolean {
    const sign = params.sign;
    if (!sign) return false;

    // 移除 sign 和 sign_type
    const verifyParams = { ...params };
    delete verifyParams.sign;
    delete verifyParams.sign_type;

    // 按照字母顺序排序参数
    const sortedParams = Object.keys(verifyParams)
      .sort()
      .map((key) => `${key}=${verifyParams[key]}`)
      .join("&");

    // 使用支付宝公钥验证签名
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(sortedParams, "utf8");

    try {
      return verifier.verify(this.config.publicKey, sign, "base64");
    } catch (error) {
      console.error("[Alipay] Signature verification failed:", error);
      return false;
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(outTradeNo: string): Promise<AlipayResponse> {
    const bizContent = {
      out_trade_no: outTradeNo,
    };

    const requestParams: Record<string, string> = {
      app_id: this.config.appId,
      method: "alipay.trade.query",
      format: "JSON",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      version: "1.0",
      sign_type: "RSA2",
      charset: "utf-8",
      biz_content: JSON.stringify(bizContent),
    };

    const sign = this.sign(requestParams);
    requestParams.sign = sign;

    const queryString = Object.entries(requestParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");

    try {
      const response = await fetch(`${this.apiUrl}?${queryString}`, {
        method: "GET",
      });
      const data = await response.json();
      return data.alipay_trade_query_response || data;
    } catch (error) {
      console.error("[Alipay] Query order failed:", error);
      throw error;
    }
  }

  /**
   * 生成签名
   */
  private sign(params: Record<string, string>): string {
    // 按照字母顺序排序参数
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    // 使用私钥签名
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(sortedParams, "utf8");
    return signer.sign(this.config.privateKey, "base64");
  }
}

/**
 * 创建支付宝客户端实例
 */
export function createAlipayClient(config: AlipayConfig): AlipayClient {
  return new AlipayClient(config);
}
