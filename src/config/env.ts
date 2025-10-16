// 自动根据构建模式选择环境
// - npm run dev:h5 → 使用本地 localhost:8055
// - npm run build:mp-weixin → 使用线上 https://www.betterhome.ink

// 使用 process.env.NODE_ENV 判断环境（在构建时可用）
const isProduction = process.env.NODE_ENV === 'production';

// 开发环境配置（本地开发用）
const developmentConfig = {
  baseUrl: "https://www.betterhome.ink",
  apiBaseUrl: "https://www.betterhome.ink",
  directusUrl: "https://www.betterhome.ink",
  residentRoleId: "e30e1f74-dd04-46c6-90ed-4162852b5da4",
};

// 生产环境配置（构建用）
const productionConfig = {
  baseUrl: "https://www.betterhome.ink",
  apiBaseUrl: "https://www.betterhome.ink",
  directusUrl: "https://www.betterhome.ink",
  residentRoleId: "e30e1f74-dd04-46c6-90ed-4162852b5da4",
};

// 其他环境配置（保留备用）
const envMap = {
  dev: developmentConfig,
  prod: productionConfig,
  beta: {
    baseUrl: "http://m.beta.xxx.com",
    apiBaseUrl: "https://m.betaapi.xxx.com",
    directusUrl: "https://m.betaapi.xxx.com",
    residentRoleId: "",
  },
  local: {
    baseUrl: "http://m.dev.xxx.com",
    apiBaseUrl: "https://m.devapi.xxx.com",
    directusUrl: "https://m.devapi.xxx.com",
    residentRoleId: "",
  },
};

type ApiEnv = keyof typeof envMap;
type Env<T extends ApiEnv> = {
  apiEnv: T;
} & (typeof envMap)[T];

function createEnv(apiEnv: ApiEnv): Env<typeof apiEnv> {
  return Object.assign({ apiEnv }, envMap[apiEnv]);
}

// 根据构建模式自动选择环境
const currentEnv = isProduction ? 'prod' : 'dev';
const env = createEnv(currentEnv);

// 打印当前环境信息（方便调试）
console.log(`[ENV] 当前环境: ${currentEnv} (NODE_ENV: ${process.env.NODE_ENV})`);
console.log(`[ENV] Directus URL: ${env.directusUrl}`);

export default env;
