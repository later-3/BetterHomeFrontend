<script setup lang="ts">
import { onHide, onLaunch, onShow } from "@dcloudio/uni-app";
import { useNavigationStore } from "@/store/navigation";

onLaunch(() => {
  console.log("App Launch");
  // 初始化导航状态
  const navigationStore = useNavigationStore();
  navigationStore.initNavigation();
});

onShow(() => {
  console.log("App Show");
  // 应用显示时更新导航状态
  const navigationStore = useNavigationStore();
  navigationStore.initNavigation();
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style></style>
