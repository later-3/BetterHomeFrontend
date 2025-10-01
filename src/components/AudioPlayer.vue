<template>
  <view class="ap-card">
    <view class="ap-row">
      <view v-if="cover" class="ap-cover">
        <image :src="cover" mode="aspectFill" />
      </view>

      <view class="ap-main">
        <view class="ap-title" v-if="title">{{ title }}</view>

        <view class="ap-controls">
          <button class="ap-btn" @click="toggle">
            <text v-if="!playing">▶︎</text>
            <text v-else>⏸</text>
          </button>

          <view class="ap-times">
            <text class="ap-time">{{ fmt(current) }}</text>
            <text class="ap-time sep">/</text>
            <text class="ap-time">{{ fmt(duration) }}</text>
          </view>

          <picker
            class="ap-speed"
            :range="speedOptions"
            :value="speedIndex"
            @change="onSpeedChange"
          >
            <view class="ap-speed-btn">{{ speedOptions[speedIndex] }}×</view>
          </picker>
        </view>

        <view
          class="ap-bar"
          :id="barId"
          @touchstart="onSeekStart"
          @touchmove.stop.prevent="onSeekMove"
          @touchend="onSeekEnd"
          @tap="onBarTap"
        >
          <view class="ap-bar-bg"></view>
          <view class="ap-bar-fill" :style="{ width: progress + '%' }"></view>
          <view class="ap-bar-dot" :style="{ left: progress + '%' }"></view>
        </view>

        <view v-if="err" class="ap-err">{{ err }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  getCurrentInstance,
  computed,
} from "vue";

/** Props */
const props = withDefaults(
  defineProps<{
    src: string;
    title?: string;
    cover?: string;
    autoplay?: boolean;
    speeds?: number[]; // 可选倍速列表，如 [0.75, 1.0, 1.25, 1.5, 2.0]
  }>(),
  {
    title: "音频",
    cover: "",
    autoplay: false,
    speeds: () => [0.75, 1.0, 1.25, 1.5, 2.0],
  }
);

/** State */
const playing = ref(false);
const current = ref(0);
const duration = ref(0);
const err = ref("");
const speedIndex = ref(1); // 默认 1.0x
const speedOptions = computed(() => props.speeds.map((s) => String(s)));
const progress = computed(() =>
  duration.value
    ? Math.min(100, Math.max(0, (current.value / duration.value) * 100))
    : 0
);
const barId = "bar-" + Math.random().toString(36).slice(2);
const inst = getCurrentInstance();

/** 底层内核：小程序=InnerAudioContext；H5=HTMLAudio */
type Core = {
  play(): void;
  pause(): void;
  stop(): void;
  seek(t: number): void;
  setRate?(r: number): void;
  onTimeUpdate(cb: () => void): void;
  onPlay(cb: () => void): void;
  onPause(cb: () => void): void;
  onEnded(cb: () => void): void;
  onError(cb: (e: any) => void): void;
  get currentTime(): number;
  get duration(): number;
  set src(u: string);
  destroy(): void;
};
let core: Core | null = null;

function createCore(src: string): Core {
  // 小程序端
  // #ifdef MP
  const ctx = uni.createInnerAudioContext();
  ctx.src = src;
  ctx.obeyMuteSwitch = false;
  return {
    play: () => ctx.play(),
    pause: () => ctx.pause(),
    stop: () => ctx.stop(),
    seek: (t: number) => ctx.seek(t),
    setRate: (r: number) => {
      try {
        /* 微信不直接暴露倍速，部分端可通过 webAudio 不建议；忽略 */
      } catch {}
    },
    onTimeUpdate: (cb) => ctx.onTimeUpdate(cb),
    onPlay: (cb) => ctx.onPlay(cb),
    onPause: (cb) => ctx.onPause(cb),
    onEnded: (cb) => ctx.onEnded(cb),
    onError: (cb) => ctx.onError(cb as any),
    get currentTime() {
      return ctx.currentTime || 0;
    },
    get duration() {
      return isFinite(ctx.duration as any) ? ctx.duration || 0 : 0;
    },
    set src(u: string) {
      ctx.src = u;
    },
    destroy: () => {
      ctx.stop();
      ctx.destroy();
    },
  };
  // #endif

  // H5 端
  // #ifdef H5
  const audio = new Audio(src);
  audio.preload = "metadata";
  return {
    play: () => void audio.play(),
    pause: () => void audio.pause(),
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
    seek: (t: number) => {
      audio.currentTime = t;
    },
    setRate: (r: number) => {
      audio.playbackRate = r;
    },
    onTimeUpdate: (cb) => audio.addEventListener("timeupdate", cb),
    onPlay: (cb) => audio.addEventListener("play", cb),
    onPause: (cb) => audio.addEventListener("pause", cb),
    onEnded: (cb) => audio.addEventListener("ended", cb),
    onError: (cb) => audio.addEventListener("error", cb as any),
    get currentTime() {
      return audio.currentTime || 0;
    },
    get duration() {
      return isFinite(audio.duration) ? audio.duration || 0 : 0;
    },
    set src(u: string) {
      audio.src = u;
    },
    destroy: () => {
      audio.pause();
      audio.src = "";
    },
  };
  // #endif
}

/** 初始化与销毁 */
function init(src: string) {
  dispose();
  core = createCore(src);

  core.onPlay(() => {
    playing.value = true;
    err.value = "";
  });
  core.onPause(() => {
    playing.value = false;
  });
  core.onEnded(() => {
    playing.value = false;
  });
  core.onTimeUpdate(() => {
    if (!core || !core.currentTime) return;
    const time = core.currentTime || 0;
    const total = core.duration || 0;
    current.value = time;
    if (!duration.value && total) duration.value = total;
  });
  // 部分端初始 duration 为 0：轻触发一次
  setTimeout(() => {
    if (!duration.value && core) {
      try {
        core.play();
        setTimeout(() => {
          core && core.pause();
        }, 60);
      } catch (err) {
        console.warn("audio init play failed", err);
      }
    }
  }, 60);

  // 倍速（仅 H5 真正生效；小程序端多数场景忽略）
  setRate(props.speeds[speedIndex.value]);

  if (props.autoplay) core.play();
}
function dispose() {
  try {
    core?.destroy();
  } catch {}
  core = null;
  playing.value = false;
  current.value = 0;
  duration.value = 0;
  err.value = "";
}

onMounted(() => init(props.src));
onUnmounted(dispose);

/** props 变更时重建 */
watch(
  () => props.src,
  (u) => {
    if (u) init(u);
  }
);

/** 控制方法 */
function toggle() {
  playing.value ? core?.pause() : core?.play();
}
function setRate(r: number) {
  try {
    core?.setRate?.(r);
  } catch {}
}
function onSpeedChange(e: any) {
  speedIndex.value = Number(e.detail.value);
  setRate(props.speeds[speedIndex.value]);
}

/** 进度条交互（tap/drag） */
let seeking = false;
function rectBar(cb: (rect: any) => void) {
  const q = uni.createSelectorQuery().in(inst as any);
  q.select("#" + barId)
    .boundingClientRect((rect: any) => rect && cb(rect))
    .exec();
}
function seekToRatio(ratio: number) {
  if (!core || !duration.value) return;
  const to = Math.max(
    0,
    Math.min(duration.value * ratio, Math.max(duration.value - 0.2, 0))
  );
  core.seek(to);
}
function onBarTap(e: any) {
  rectBar((rect) => {
    const x = (e.detail?.x ?? e.touches?.[0]?.pageX) as number;
    if (typeof x !== "number") return;
    const ratio = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
    seekToRatio(ratio);
  });
}
function onSeekStart(e: any) {
  seeking = true;
  onSeekMove(e);
}
function onSeekMove(e: any) {
  if (!seeking) return;
  rectBar((rect) => {
    const x = e.touches?.[0]?.pageX as number;
    if (typeof x !== "number") return;
    const ratio = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
    seekToRatio(ratio);
  });
}
function onSeekEnd() {
  seeking = false;
}

/** 工具 */
function fmt(s: number) {
  const t = Math.max(0, Math.floor(s || 0));
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** 暴露给父组件（用于统一暂停） */
defineExpose({ pause: () => core?.pause() });
</script>

<style scoped>
.ap-card {
  margin: 12px 0;
  padding: 12px;
  border-radius: 16px;
  width: 100%;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.ap-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.ap-cover {
  overflow: hidden;
  flex: 0 0 56px;
  border-radius: 12px;
  width: 56px;
  height: 56px;
}
.ap-cover image {
  display: block;
  width: 100%;
  height: 100%;
}
.ap-main {
  flex: 1;
  min-width: 0;
}
.ap-title {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 16px;
}
.ap-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ap-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 18px;
  min-width: 48px;
  height: 36px;
  background: #111;
  line-height: 36px;
  color: #fff;
}
.ap-times {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  gap: 6px;
}
.ap-time.sep {
  opacity: 0.6;
}
.ap-speed-btn {
  padding: 0 10px;
  border-radius: 14px;
  height: 28px;
  background: #f2f2f2;
  line-height: 28px;
  font-size: 12px;
}
.ap-speed {
  margin-left: auto;
}
.ap-bar {
  position: relative;
  margin-top: 10px;
  border-radius: 4px;
  height: 8px;
}
.ap-bar-bg {
  position: absolute;
  border-radius: 4px;
  background: #eee;
  inset: 0;
}
.ap-bar-fill {
  position: absolute;
  border-radius: 4px;
  height: 8px;
  background: #111;
  inset: 0 auto 0 0;
}
.ap-bar-dot {
  position: absolute;
  top: 50%;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  background: #111;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
}
.ap-err {
  margin-top: 8px;
  font-size: 12px;
  color: #e33;
}
</style>
