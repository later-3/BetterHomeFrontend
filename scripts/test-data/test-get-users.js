#!/usr/bin/env node

// 测试获取Directus用户

const env = process.argv[2] || 'local';

const DIRECTUS_CONFIG = {
  local: {
    url: 'http://localhost:8055',
    token: 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'
  },
  remote: {
    url: 'https://www.betterhome.ink',
    token: 'sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'
  }
};

const directus = DIRECTUS_CONFIG[env];

async function fetchDirectus(endpoint) {
  const url = `${directus.url}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${directus.token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function test() {
  console.log(`测试环境: ${env} (${directus.url})\n`);

  // 1. 获取resident角色
  console.log('Step 1: 获取resident角色...');
  const rolesResult = await fetchDirectus('/roles?filter[name][_eq]=resident&fields=id,name');
  console.log(`   结果: ${JSON.stringify(rolesResult.data)}`);

  if (!rolesResult.data || rolesResult.data.length === 0) {
    console.log('   ❌ 未找到resident角色\n');
    return;
  }

  const residentRoleId = rolesResult.data[0].id;
  console.log(`   ✅ resident角色ID: ${residentRoleId}\n`);

  // 2. 用角色ID获取用户
  console.log('Step 2: 用角色ID获取用户...');
  const usersResult = await fetchDirectus(`/users?filter[role][_eq]=${residentRoleId}&limit=-1&fields=id,first_name,last_name,email`);

  console.log(`   ✅ 找到 ${usersResult.data.length} 个用户:\n`);

  for (const user of usersResult.data.slice(0, 10)) {
    const name = user.first_name || user.last_name || user.email;
    console.log(`      - ${name} (${user.id})`);
  }

  if (usersResult.data.length > 10) {
    console.log(`      ... 还有 ${usersResult.data.length - 10} 个用户`);
  }
}

test().catch(console.error);
