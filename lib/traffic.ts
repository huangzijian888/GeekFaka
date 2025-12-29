import { prisma } from './prisma';
import { logger } from './logger';

const log = logger.child({ module: 'TrafficAPI' });
const BASE_URL = "https://api.cliproxy.com/traffic";

interface APIResponse {
  code: number;
  msg: string;
  data?: any;
}

async function getAPIKey() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "cliproxy_api_key" } });
  return setting?.value;
}

export async function createTrafficSubUser(orderNo: string, password?: string) {
  const key = await getAPIKey();
  if (!key) throw new Error("高级接口密钥未配置");

  // Use HTStore prefix as requested
  const randomSuffix = Math.random().toString(36).slice(-6).toUpperCase();
  const username = `HTStore${randomSuffix}`;
  const pass = password || Math.random().toString(36).slice(-8);

  const res = await fetch(`${BASE_URL}/addSubUser`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      key,
      username,
      password: pass,
      traffic: "1", // Default 1GB
      title: `Order ${orderNo}`
    })
  });

  const data: APIResponse = await res.json();
  if (data.code !== 0) {
    throw new Error(`系统接口错误: ${data.msg}`);
  }

  return { username, password: pass };
}

export async function deleteTrafficSubUser(username: string) {
  const key = await getAPIKey();
  if (!key) return;

  const res = await fetch(`${BASE_URL}/delSubUser`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ key, username })
  });

  const data: APIResponse = await res.json();
  log.info({ username, data }, "Attempted to delete sub-user");
  return data.code === 0;
}

export async function queryTrafficUsage(username: string) {
  const key = await getAPIKey();
  if (!key) throw new Error("高级接口密钥未配置");

  const res = await fetch(`${BASE_URL}/querySubUser`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ key, username })
  });

  const data: APIResponse = await res.json();
  if (data.code === 0 && data.data && data.data.length > 0) {
    return data.data[0]; // { username, traffic, alltraffic }
  }
  return null;
}
