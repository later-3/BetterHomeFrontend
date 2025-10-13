const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- 配置 ---
const NUM_AVATARS = 100; // 要下载的头像数量
const AVATAR_SIZE = 200; // 头像尺寸 (宽度和高度)
const OUTPUT_DIR = './random_avatars'; // 保存图片的目录

// --- 脚本主函数 ---
async function downloadRandomAvatars() {
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
    console.log(`创建目录: ${OUTPUT_DIR}`);
  }

  console.log(`准备下载 ${NUM_AVATARS} 个随机头像...`);

  const downloadPromises = []; // 用来存放所有的下载任务

  for (let i = 1; i <= NUM_AVATARS; i++) {
    // 1. 构建随机头像的 URL (不加 ?u= 参数)
    const url = `https://i.pravatar.cc/${AVATAR_SIZE}`;
    
    // 2. 自动生成文件名
    const filename = `avatar_${i}.jpg`;
    const filePath = path.resolve(OUTPUT_DIR, filename);

    // 创建一个下载任务的 Promise
    const downloadPromise = axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    }).then(response => {
      // 使用 Promise 来处理文件写入的完成状态
      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        let error = null;
        writer.on('error', err => {
          error = err;
          writer.close();
          console.error(`❌ 写入文件失败: ${filename}`, err);
          reject(err);
        });
        writer.on('close', () => {
          if (!error) {
            console.log(`✅ 下载成功: ${filename}`);
            resolve(true);
          }
        });
      });
    }).catch(error => {
      console.error(`❌ 请求失败: ${url}`, error.message);
    });

    downloadPromises.push(downloadPromise);
  }

  // 等待所有下载任务完成
  await Promise.all(downloadPromises);

  console.log('所有下载任务已处理完毕！');
}

// 运行脚本
downloadRandomAvatars();

