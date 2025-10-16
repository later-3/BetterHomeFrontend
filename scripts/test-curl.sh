#!/bin/bash

# 测试 curl 命令

echo "测试 1: 简单的 ping"
curl -s http://localhost:8055/server/ping
echo ""

echo ""
echo "测试 2: 获取账单（不带过滤）"
curl -s -X GET "http://localhost:8055/items/billings?limit=1" \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
echo ""

echo ""
echo "测试 3: 获取账单（带过滤）"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"
curl -s -X GET "http://localhost:8055/items/billings?filter[community_id][_eq]=${COMMUNITY_ID}&limit=1" \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
echo ""

echo ""
echo "测试 4: 保存到变量"
RESULT=$(curl -s -X GET "http://localhost:8055/items/billings?limit=1" \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n")
echo "变量长度: ${#RESULT}"
echo "变量内容前100字符: ${RESULT:0:100}"
echo ""

echo ""
echo "测试 5: 保存到文件"
curl -s -X GET "http://localhost:8055/items/billings?limit=1" \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n" > test_output.json
echo "文件大小: $(wc -c < test_output.json) 字节"
echo "文件内容:"
cat test_output.json
