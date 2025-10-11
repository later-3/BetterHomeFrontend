const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- 配置 ---
const AVATAR_SIZE = 200; // 头像尺寸
const OUTPUT_DIR = './avatars'; // 保存图片的目录
// 需要下载头像的用户列表
const users = [
  { id: 'zhangsan', filename: 'zhangsan.jpg' },
  { id: 'lisi', filename: 'lisi.jpg' },
  { id: 'wangwu', filename: 'wangwu.jpg' },
  { id: 'zhaoliu', filename: 'zhaoliu.jpg' }
];

// --- 脚本主函数 ---
async function downloadAvatars() {
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
    console.log(`创建目录: ${OUTPUT_DIR}`);
  }

  console.log('开始批量下载头像...');

  for (const user of users) {
    const url = `https://i.pravatar.cc/${AVATAR_SIZE}?u=${user.id}`;
    const filePath = path.resolve(OUTPUT_DIR, user.filename);
    
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream' // 以流的形式接收数据
      });

      // 将图片数据流写入文件
      response.data.pipe(fs.createWriteStream(filePath));
      
      // 等待文件写入完成
      await new Promise((resolve, reject) => {
        response.data.on('end', () => {
          console.log(`✅ 下载成功: ${user.filename}`);
          resolve();
        });
        response.data.on('error', (err) => {
          console.error(`❌ 下载失败: ${user.filename}`, err);
          reject(err);
        });
      });

    } catch (error) {
      console.error(`❌ 请求失败: ${url}`, error.message);
    }
  }

  console.log('所有下载任务已处理完毕！');
}

// 运行脚本
downloadAvatars();

