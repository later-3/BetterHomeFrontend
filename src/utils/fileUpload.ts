import { useUserStore } from "@/store/user";
import env from "@/config/env";

/**
 * 上传单个文件到Directus
 * @param filePath 文件路径
 * @returns 文件ID
 */
export const uploadFileToDirectus = async (
  filePath: string
): Promise<string> => {
  const userStore = useUserStore();
  const token = userStore.token;

  if (!token) {
    throw new Error("用户未登录");
  }

  try {
    const uploadRes = await uni.uploadFile({
      url: `${env.directusUrl}/files`,
      filePath: filePath,
      name: "file",
      header: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
      const payload = JSON.parse(uploadRes.data || "{}");
      const fileId = payload?.data?.id;

      if (!fileId) {
        throw new Error("文件上传失败：未获取到文件ID");
      }

      return fileId;
    } else {
      throw new Error(`文件上传失败：HTTP ${uploadRes.statusCode}`);
    }
  } catch (error: any) {
    console.error("文件上传错误:", error);
    throw new Error(error?.message || "文件上传失败");
  }
};

/**
 * 批量上传文件到Directus
 * @param filePaths 文件路径数组
 * @returns 文件ID数组
 */
export const uploadMultipleFiles = async (
  filePaths: string[]
): Promise<string[]> => {
  if (!filePaths.length) return [];

  const uploadPromises = filePaths.map((path) => uploadFileToDirectus(path));
  return Promise.all(uploadPromises);
};

/**
 * 获取文件的真实路径（处理不同平台的文件路径）
 * @param file 文件对象
 * @returns 文件路径
 */
export const getFilePath = (file: any): string => {
  console.log("getFilePath - 输入文件对象:", file);

  if (typeof file === "string") {
    console.log("getFilePath - 文件是字符串:", file);
    return file;
  }

  // uni-app 文件选择返回的路径
  if (file.tempFilePath) {
    console.log("getFilePath - 使用tempFilePath:", file.tempFilePath);
    return file.tempFilePath;
  }

  if (file.path) {
    console.log("getFilePath - 使用path:", file.path);
    return file.path;
  }

  // UView组件返回的文件路径通常在url字段中
  // 包括blob:开头的本地文件路径
  if (file.url) {
    console.log("getFilePath - 使用url:", file.url);
    return file.url;
  }

  // 尝试其他可能的路径字段
  if (file.filePath) {
    console.log("getFilePath - 使用filePath:", file.filePath);
    return file.filePath;
  }

  if (file.src) {
    console.log("getFilePath - 使用src:", file.src);
    return file.src;
  }

  console.error(
    "getFilePath - 无法获取文件路径，文件对象:",
    JSON.stringify(file, null, 2)
  );
  throw new Error(
    `无法获取文件路径，可用字段: ${Object.keys(file).join(", ")}`
  );
};
