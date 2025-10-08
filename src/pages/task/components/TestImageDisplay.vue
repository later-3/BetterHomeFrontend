<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useWorkOrderStore } from "@/store/workOrders";
import { getFileUrl, isImageFile } from "@/utils/fileUtils";
import type { DirectusFile } from "@/@types/directus-schema";

const workOrderStore = useWorkOrderStore();
const imageUrls = ref<string[]>([]);

onMounted(async () => {
  // 获取工作订单数据
  await workOrderStore.refresh();
  
  // 查找第一个有文件的工单
  const firstWorkOrderWithFiles = workOrderStore.items.find(
    (item) => item.files && item.files.length > 0
  );

  if (firstWorkOrderWithFiles) {
    console.log("第一个有文件的工单:", firstWorkOrderWithFiles);
    
    if (firstWorkOrderWithFiles.files && Array.isArray(firstWorkOrderWithFiles.files)) {
      console.log("文件数据:", firstWorkOrderWithFiles.files);
      
      // 提取图片URL
      for (const fileRelation of firstWorkOrderWithFiles.files) {
        if (fileRelation && typeof fileRelation === 'object' && 'directus_files_id' in fileRelation) {
          const file = fileRelation.directus_files_id;
          
          if (file && typeof file === 'object' && 'id' in file) {
            const directusFile = file as DirectusFile;
            console.log("文件信息:", directusFile);
            
            if (isImageFile(directusFile)) {
              const fileUrl = getFileUrl(directusFile);
              console.log("图片URL:", fileUrl);
              if (fileUrl) {
                imageUrls.value.push(fileUrl);
              }
            }
          }
        }
      }
    }
  } else {
    console.log("没有找到带有文件的工单");
  }
});
</script>

<template>
  <view class="test-container">
    <text class="title">图片显示测试</text>
    
    <view v-if="imageUrls.length > 0">
      <text>找到 {{ imageUrls.length }} 张图片:</text>
      <view class="image-list">
        <up-image
          v-for="(url, index) in imageUrls"
          :key="index"
          :src="url"
          width="200px"
          height="200px"
          mode="aspectFill"
          radius="8"
        />
      </view>
    </view>
    
    <view v-else>
      <text>没有找到图片附件</text>
    </view>
  </view>
</template>

<style scoped>
.test-container {
  padding: 20px;
}
.title {
  margin-bottom: 20px;
  font-weight: bold;
  font-size: 18px;
}
.image-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
</style>