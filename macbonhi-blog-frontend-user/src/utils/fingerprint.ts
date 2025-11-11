/**
 * 浏览器指纹生成工具
 * 用于在不使用cookie的情况下识别浏览器，主要用于评论和点赞功能
 */

// 方法1：使用FingerprintJS库（推荐）
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * 获取浏览器指纹
 * 使用FingerprintJS库生成稳定、唯一的浏览器标识
 * @returns 返回浏览器唯一标识符
 */
export async function getBrowserFingerprint(): Promise<string> {
  try {
    // 初始化FingerprintJS
    const fpPromise = FingerprintJS.load();
    const fp = await fpPromise;
    
    // 获取访问者标识
    const result = await fp.get();
    
    // 返回唯一标识符
    return result.visitorId;
  } catch (error) {
    console.error('生成浏览器指纹失败:', error);
    // 如果指纹生成失败，使用备用方法
    return getSimpleFingerprint();
  }
}

/**
 * 备用方法：简单的浏览器指纹生成
 * 当FingerprintJS库加载失败时使用
 * @returns 返回基于用户代理和时间戳的简单标识符
 */
function getSimpleFingerprint(): string {
  const userAgent = navigator.userAgent;
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const language = navigator.language;
  const timezone = new Date().getTimezoneOffset();
  
  // 组合上述信息并创建哈希
  const rawFingerprint = `${userAgent}|${screenInfo}|${language}|${timezone}`;
  
  // 简单的哈希函数
  let hash = 0;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 添加一个随机数和时间戳使其更不容易重复
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  
  return `${hash.toString(36)}_${randomPart}_${timestamp}`;
}

/**
 * 保存点赞记录到本地存储
 * @param targetType 目标类型 (0:文章, 1:评论, 3:随笔)
 * @param targetId 目标ID
 */
export function savePraisedItem(targetType: number, targetId: number): void {
  const key = `praised_${targetType}_${targetId}`;
  localStorage.setItem(key, 'true');
}

/**
 * 检查是否已点赞
 * @param targetType 目标类型 (0:文章, 1:评论, 3:随笔)
 * @param targetId 目标ID
 * @returns 是否已点赞
 */
export function hasPraisedItem(targetType: number, targetId: number): boolean {
  const key = `praised_${targetType}_${targetId}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * 移除点赞记录
 * @param targetType 目标类型 (0:文章, 1:评论, 3:随笔)
 * @param targetId 目标ID
 */
export function removePraisedItem(targetType: number, targetId: number): void {
  const key = `praised_${targetType}_${targetId}`;
  localStorage.removeItem(key);
}
