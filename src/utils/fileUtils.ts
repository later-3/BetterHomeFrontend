import type { DirectusFile } from "@/@types/directus-schema";
import env from "@/config/env";

/**
 * 生成文件的完整URL
 * @param file Directus文件对象或文件ID
 * @returns 文件的完整URL
 */
export function getFileUrl(file: DirectusFile | string | null | undefined): string | null {
  if (!file) return null;
  
  // 如果是字符串，认为是文件ID
  if (typeof file === "string") {
    return `${env.directusUrl}/assets/${file}`;
  }
  
  // 如果是对象且有ID
  if (typeof file === "object" && file.id) {
    return `${env.directusUrl}/assets/${file.id}`;
  }
  
  return null;
}

/**
 * 生成文件的缩略图URL
 * @param file Directus文件对象或文件ID
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns 缩略图的完整URL
 */
export function getThumbnailUrl(
  file: DirectusFile | string | null | undefined,
  width: number = 200,
  height: number = 200
): string | null {
  const fileUrl = getFileUrl(file);
  if (!fileUrl) return null;
  
  // 添加缩略图参数
  return `${fileUrl}?width=${width}&height=${height}&fit=cover`;
}

/**
 * 检查文件是否为图片
 * @param file Directus文件对象
 * @returns 是否为图片
 */
export function isImageFile(file: DirectusFile): boolean {
  if (!file || !file.type) return false;
  return file.type.startsWith("image/");
}

/**
 * 检查文件是否为视频
 * @param file Directus文件对象
 * @returns 是否为视频
 */
export function isVideoFile(file: DirectusFile): boolean {
  if (!file || !file.type) return false;
  return file.type.startsWith("video/");
}

export default {
  getFileUrl,
  getThumbnailUrl,
  isImageFile,
  isVideoFile,
};