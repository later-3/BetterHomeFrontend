const apiEnv: ApiEnv = "dev";

const envMap = {
  dev: {
    baseUrl: "http://m.dev.xxx.com",
    // apiBaseUrl: "http://localhost:8055",
    // directusUrl: "http://localhost:8055",
    apiBaseUrl: "http://139.155.26.118:8055",
    directusUrl: "http://139.155.26.118:8055",
    residentRoleId: "e30e1f74-dd04-46c6-90ed-4162852b5da4",
  },
  beta: {
    baseUrl: "http://m.beta.xxx.com",
    apiBaseUrl: "https://m.betaapi.xxx.com",
    directusUrl: "https://m.betaapi.xxx.com",
    residentRoleId: "",
  },
  prod: {
    baseUrl: "https://m.xxx.com",
    apiBaseUrl: "https://m.api.xxx.com",
    directusUrl: "https://m.api.xxx.com",
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

const env = createEnv(apiEnv);
export default env;
