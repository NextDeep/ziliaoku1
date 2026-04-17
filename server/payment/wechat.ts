/**
 * 微信支付接口集成模块
 * 支持微信支付 H5、APP、扫码等功能
 */
import crypto from "crypto";

/**
 * 微信支付配置
 */
export interface WechatPayConfig {
  // 商户 ID
  mchId: string;
  // API 密钥
  apiKey: string;
  // 应用 ID
  appId: string;
  // 回调 URL
  notifyUrl: string;
  // 沙箱模式（测试环境）
  sandbox?: boolean;
}

/**
 * 微信支付订单参数
 */
export interface WechatOrderParams {
  // 商户订单号（唯一）
  outTradeNo: string;
  // 商品描述
  body: string;
  // 商品详情
  detail?: string;
  // 订单总金额（单位：分）
  totalFee: number;
  // 客户端 IP
  spbillCreateIp: string;
  // 交易类型：JSAPI、APP、NATIVE、MWEB
  tradeType: "JSAPI" | "APP" | "NATIVE" | "MWEB";
  // JSAPI 交易类型时必填
  openId?: string;
}

/**
 * 微信支付响应结果
 */
export interface WechatResponse {
  return_code: string;
  return_msg: string;
  result_code?: string;
  [key: string]: any;
}

/**
 * 微信支付客户端
 */
export class WechatPayClient {
  private config: WechatPayConfig;
  private apiUrl: string;

  constructor(config: WechatPayConfig) {
    this.config = config;
    // 沙箱环境 URL
    this.apiUrl = config.sandbox
      ? "https://api.mch.weixin.qq.com/sandboxnew"
      : "https://api.mch.weixin.qq.com";
  }

  /**
   * 创建微信支付订单（统一下单）
   */
  async createOrder(params: WechatOrderParams): Promise<WechatResponse> {
    const requestData: Record<string, any> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      nonce_str: this.generateNonceStr(),
      body: params.body,
      out_trade_no: params.outTradeNo,
      total_fee: params.totalFee,
      spbill_create_ip: params.spbillCreateIp,
      notify_url: this.config.notifyUrl,
      trade_type: params.tradeType,
      openid: params.openId,
    };

    // 生成签名
    const sign = this.sign(requestData);
    requestData.sign = sign;

    // 转换为 XML 格式
    const xmlData = this.toXml(requestData);

    try {
      const response = await fetch(`${this.apiUrl}/pay/unifiedorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
        },
        body: xmlData,
      });

      const xmlResponse = await response.text();
      const result = this.parseXml(xmlResponse) as WechatResponse;

      return result;
    } catch (error) {
      console.error("[Wechat] Create order failed:", error);
      throw error;
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(outTradeNo: string): Promise<WechatResponse> {
    const requestData: Record<string, any> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      out_trade_no: outTradeNo,
      nonce_str: this.generateNonceStr(),
    };

    const sign = this.sign(requestData);
    requestData.sign = sign;

    const xmlData = this.toXml(requestData);

    try {
      const response = await fetch(`${this.apiUrl}/pay/orderquery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
        },
        body: xmlData,
      });

      const xmlResponse = await response.text();
      const result = this.parseXml(xmlResponse) as WechatResponse;

      return result;
    } catch (error) {
      console.error("[Wechat] Query order failed:", error);
      throw error;
    }
  }

  /**
   * 验证微信异步通知签名
   */
  verifyNotify(params: Record<string, string>): boolean {
    const sign = params.sign;
    if (!sign) return false;

    // 移除 sign
    const verifyParams = { ...params };
    delete verifyParams.sign;

    // 生成签名进行比对
    const expectedSign = this.sign(verifyParams);

    return sign === expectedSign;
  }

  /**
   * 生成签名
   */
  private sign(data: Record<string, any>): string {
    // 按照字母顺序排序参数
    const sortedKeys = Object.keys(data)
      .filter((key) => data[key] !== "" && data[key] !== undefined)
      .sort();

    const signString = sortedKeys
      .map((key) => `${key}=${data[key]}`)
      .join("&");

    // 添加 API 密钥
    const stringToSign = `${signString}&key=${this.config.apiKey}`;

    // MD5 签名
    return crypto.createHash("md5").update(stringToSign).digest("hex").toUpperCase();
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * 对象转 XML
   */
  private toXml(data: Record<string, any>): string {
    let xml = "<xml>";
    for (const key in data) {
      const value = data[key];
      if (value === undefined || value === null) continue;

      // 检查是否需要 CDATA
      if (typeof value === "string" && /[<>&]/.test(value)) {
        xml += `<${key}><![CDATA[${value}]]></${key}>`;
      } else {
        xml += `<${key}>${value}</${key}>`;
      }
    }
    xml += "</xml>";
    return xml;
  }

  /**
   * XML 转对象
   */
  private parseXml(xml: string): Record<string, any> {
    const result: Record<string, any> = {};

    // 简单的 XML 解析（生产环境建议使用专门的 XML 库）
    const regex = /<(\w+)>([^<]*)<\/\1>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      const [, key, value] = match;
      result[key] = value;
    }

    return result;
  }
}

/**
 * 创建微信支付客户端实例
 */
export function createWechatPayClient(config: WechatPayConfig): WechatPayClient {
  return new WechatPayClient(config);
}
