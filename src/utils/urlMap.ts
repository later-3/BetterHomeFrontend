import pagesJson from '../pages.json';

type PageConfig = {
  name?: string;
  path: string;
};

type SubPackageConfig = {
  root: string;
  pages?: PageConfig[];
};

const pages = Array.isArray(pagesJson.pages) ? (pagesJson.pages as PageConfig[]) : [];
const subPackages = Array.isArray(pagesJson.subPackages)
  ? (pagesJson.subPackages as SubPackageConfig[])
  : [];

// tabBar页面
const tabBarPagesMap = pages.map((i) => ({
  type: 'tabBarPage' as const,
  name: i.name,
  path: `/${i.path}`
}));

// 二级页面
const subPagesMap = subPackages.flatMap((pkg) => {
  if (!Array.isArray(pkg.pages)) return [] as const;

  return pkg.pages.map((page) => ({
    type: 'subPage' as const,
    name: page.name,
    path: `/${pkg.root}/${page.path}`
  }));
});

// h5页面
export const h5HsqMap = ['member-center'];

export const pagesMap = [...tabBarPagesMap, ...subPagesMap];

// 需要登录权限的页面
export const needAuthPath = ['member-center', 'service'];

const types = {
  h5Hsq: /(m(\.dev|\.beta)?\.haoshiqi\.net\/v2)/i,
  topicType: /(topic(\.dev|\.beta)?\.doweidu\.com)/i,
  h5: /^(https|http):\/\//i
};

export function getUrlType(url: string) {
  if (types.h5Hsq.test(url)) return 'h5Hsq';
  if (types.topicType.test(url)) return 'topic';
  if (types.h5.test(url)) return 'h5'; // 暂时笼统判断都是hsq Url
  return 'other';
}
