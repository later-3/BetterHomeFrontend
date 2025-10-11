<template>
  <view class="detail-page">
    <!-- 区域1：显示原始卡片 -->
    <view class="original-card-section">
      <div v-if="selectedPost" class="post-card">
        <div class="post-header">
          <div class="user-info">
            <!-- 显示用户头像，如果有的话 -->
            <div class="avatar">
              <img
                v-if="selectedPost.user.avatar"
                :src="selectedPost.user.avatar"
                class="avatar-image"
                alt="用户头像"
              />
              <div v-else class="avatar-placeholder">👤</div>
            </div>
            <div class="user-details">
              <div class="user-name-time">
                <span class="user-name">{{ selectedPost.user.name }}</span>
                <span class="post-time">• {{ selectedPost.user.time }}</span>
              </div>
              <div class="user-title">{{ selectedPost.user.title }}</div>
            </div>
          </div>
          <div class="more-options">⋯</div>
        </div>

        <div class="post-content">
          {{ selectedPost.content }}
        </div>

        <!-- 图片展示 -->
        <div
          v-if="selectedPost.type === 'image' && selectedPost.images"
          class="post-images"
        >
          <div class="image-grid">
            <div
              v-for="(image, index) in selectedPost.images.slice(0, 2)"
              :key="index"
              class="image-item"
            >
              <img
                v-if="image"
                :src="image"
                class="actual-image"
                alt="社交动态图片"
              />
              <div v-else class="image-placeholder">📷</div>
            </div>
          </div>
        </div>

        <div class="post-actions">
          <div class="action-group">
            <div class="action-item">
              <span class="action-icon">❤️</span>
              <span class="action-count">{{ selectedPost.likes }}</span>
            </div>
            <div class="action-item">
              <span class="action-icon">💬</span>
              <span class="action-count">{{ selectedPost.comments }}</span>
            </div>
          </div>
          <div class="share-group">
            <span class="share-icon">📤</span>
            <span class="bookmark-icon">🔖</span>
          </div>
        </div>
      </div>
    </view>

    <!-- 区域2：评论调试区域 -->
    <view class="detail-ui-section">
      <view class="simple-text">评论调试专区（区域二）</view>

      <view class="comment-debug-panel">
        <view class="debug-row">
          <button
            class="debug-btn"
            :disabled="commentLoading"
            @click="fetchComments"
          >
            {{ commentLoading ? "获取中..." : "获取评论" }}
          </button>
          <view class="content-id-text"
            >内容 ID：{{ contentId || "未传入" }}</view
          >
        </view>

        <view class="debug-block">
          <view class="debug-block__header">
            <text class="debug-block__title">请求（GET）</text>
            <button
              class="copy-btn"
              :disabled="!requestPreview"
              @click="copyText(requestPreview)"
            >
              复制
            </button>
          </view>
          <textarea
            class="debug-textarea"
            readonly
            :value="requestPreview"
            placeholder="点击上方按钮生成请求信息"
          ></textarea>
        </view>

        <view class="debug-block">
          <view class="debug-block__header">
            <text class="debug-block__title">响应内容</text>
            <button
              class="copy-btn"
              :disabled="!responseText"
              @click="copyText(responseText)"
            >
              复制
            </button>
          </view>
          <textarea
            class="debug-textarea"
            readonly
            :value="responseText"
            placeholder="尚未获取到评论数据"
          ></textarea>
        </view>

        <view class="debug-block" v-if="errorText">
          <view class="debug-block__header error">
            <text class="debug-block__title">错误信息</text>
            <button class="copy-btn" @click="copyText(errorText)">复制</button>
          </view>
          <textarea
            class="debug-textarea error"
            readonly
            :value="errorText"
          ></textarea>
        </view>
      </view>

      <view class="comment-list" v-if="commentsList.length">
        <view class="comment-title">评论列表（{{ commentsList.length }}）</view>
        <BasicCommentItem
          v-for="item in commentsList"
          :key="item.id"
          :comment="item"
          :resolve-asset-url="getAssetUrl"
          @like="handleCommentLike"
          @reply="handleCommentReply"
        />
      </view>

      <view v-else-if="responseText && !commentLoading" class="comment-empty">
        暂无评论
      </view>

      <!-- 回复输入框 -->
      <ReplyInput
        :visible="showReplyInput"
        :current-user="currentUser"
        :reply-to="replyTarget"
        :resolve-asset-url="getAssetUrl"
        @submit="handleReplySubmit"
        @cancel="handleReplyCancel"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/user";
import { mapCommentsResponse } from "@/services/comments/adapter";
import type { CommentEntity } from "@/services/comments/types";
import {
  createCommentReaction,
  deleteCommentReaction,
} from "@/services/comments/api";
import BasicCommentItem from "@ui/comment/components/BasicCommentItem.vue";
import ReplyInput from "@ui/comment/components/ReplyInput.vue";

const BASE_COMMENT_FIELDS = [
  "id",
  "text",
  "like_count",
  "unlike_count",
  "replies_count",
  "date_created",
  "user_created",
  "author_id.id",
  "author_id.first_name",
  "author_id.last_name",
  "author_id.avatar",
  "attachments.id",
  "attachments.directus_files_id.id",
  "attachments.directus_files_id.type",
  "attachments.directus_files_id.filename_download",
  "attachments.directus_files_id.title",
];

const REACTION_FIELDS = [
  "reactions.id",
  "reactions.reaction",
  "reactions.user_id",
];

// 页面参数
const contentId = ref("");
const selectedPost = ref<any>(null);

// 模拟的posts数据存储（实际应该从全局状态或API获取）
const allPosts = ref<any[]>([]);

// 评论调试相关状态
const apiBaseUrl = ref("/api");
const commentLoading = ref(false);
const requestPreview = ref("");
const responseText = ref("");
const errorText = ref("");

const userStore = useUserStore();
const { token, isLoggedIn } = storeToRefs(userStore);
const commentsList = ref<CommentEntity[]>([]);
const reactionInFlight = new Set<string>();

// 回复相关状态
const showReplyInput = ref(false);
const replyTarget = ref<{ id: string; name: string } | null>(null);

const currentUser = computed(() => {
  if (!isLoggedIn.value || !userStore.userInfo.id) return null;

  const { id, first_name, last_name, email } = userStore.userInfo;
  const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();

  return {
    id,
    name: fullName || email || id,
    avatar: undefined,
  };
});

// 页面加载时接收参数
onLoad((query: any) => {
  console.log("详情页接收到的参数:", query);
  contentId.value = query.contentId || "";

  // 从localStorage或其他方式获取posts数据
  loadPostsData();

  // 根据contentId找到对应的post
  findSelectedPost();
});

// 加载posts数据（临时方案，实际应该从全局状态管理获取）
function loadPostsData() {
  try {
    // 尝试从localStorage获取socialFeedPosts数据
    const storedPosts = uni.getStorageSync("temp_social_posts");
    if (storedPosts) {
      allPosts.value = JSON.parse(storedPosts);
      console.log("从localStorage加载posts数据:", allPosts.value.length);
    }
  } catch (error) {
    console.error("加载posts数据失败:", error);
  }
}

// 根据contentId找到选中的post
function findSelectedPost() {
  if (!contentId.value || !allPosts.value.length) {
    console.warn("无法找到对应的post数据");
    return;
  }

  selectedPost.value = allPosts.value.find(
    (post) => String(post.id) === String(contentId.value)
  );

  if (!selectedPost.value) {
    console.error("未找到对应的post:", contentId.value);
    // 可以显示错误提示或返回上一页
  } else {
    console.log("找到选中的post:", selectedPost.value);
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack();
}

onMounted(() => {
  console.log("详情页加载完成");
});

function ensureContentId(): string {
  if (!contentId.value) {
    errorText.value = "未获取到内容 ID，无法请求评论。";
    uni.showToast({ title: "缺少内容 ID", icon: "none" });
    return "";
  }
  return contentId.value;
}

async function fetchComments() {
  errorText.value = "";
  commentsList.value = [];
  responseText.value = "";
  const id = ensureContentId();
  if (!id) return;

  if (!token.value) {
    errorText.value = "未登录或缺少访问令牌，请先登录。";
    uni.showToast({ title: "缺少 token", icon: "none" });
    return;
  }

  const url = `${apiBaseUrl.value}/items/comments`;
  const requestData = buildCommentRequest(
    {
      content_id: { _eq: id },
    },
    {
      sort: "-date_created",
    }
  );

  requestPreview.value = JSON.stringify(
    {
      method: "GET",
      url,
      params: requestData,
      headers: { Authorization: `Bearer ${token.value}` },
    },
    null,
    2
  );

  commentLoading.value = true;
  try {
    const res: any = await uni.request({
      url,
      method: "GET",
      data: requestData,
      header: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      responseText.value = JSON.stringify(res.data, null, 2);
      const mapped = mapCommentsResponse(res.data?.data);
      commentsList.value = mapped;

      await hydrateUserReactions(mapped);

      if (!res.data?.data || res.data.data.length === 0) {
        uni.showToast({ title: "暂无评论", icon: "none" });
      } else {
        uni.showToast({ title: "获取成功", icon: "success" });
      }
    } else {
      throw new Error(
        `HTTP ${res.statusCode}: ${
          typeof res.data === "string" ? res.data : JSON.stringify(res.data)
        }`
      );
    }
  } catch (err: any) {
    const message = err?.message || JSON.stringify(err);
    errorText.value = `请求失败：${message}`;
    uni.showToast({ title: "请求失败", icon: "error" });
  } finally {
    commentLoading.value = false;
  }
}

function copyText(text: string) {
  if (!text) {
    uni.showToast({ title: "无内容可复制", icon: "none" });
    return;
  }
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: "已复制", icon: "success" }),
    fail: () => uni.showToast({ title: "复制失败", icon: "error" }),
  });
}

function getAssetUrl(fileId: string) {
  if (!fileId) return "";
  return `${apiBaseUrl.value}/assets/${fileId}?access_token=${token.value}`;
}

function buildCommentRequest(
  filter: Record<string, any>,
  extra: Record<string, any> = {}
): Record<string, any> {
  const fields = [...BASE_COMMENT_FIELDS];
  if (userStore.userInfo.id) {
    fields.push(...REACTION_FIELDS);
  }

  const payload: Record<string, any> = {
    filter,
    fields: fields.join(","),
    ...extra,
  };

  if (userStore.userInfo.id) {
    const deepReactions = {
      reactions: {
        _filter: {
          user_id: {
            _eq: userStore.userInfo.id,
          },
        },
        _limit: 1,
      },
    };
    payload.deep = {
      ...(payload.deep || {}),
      ...deepReactions,
    };
  }

  return payload;
}

async function refreshComment(
  commentId: string
): Promise<CommentEntity | null> {
  if (!token.value) return null;

  const url = `${apiBaseUrl.value}/items/comments`;
  const requestData = buildCommentRequest(
    {
      id: { _eq: commentId },
    },
    {
      limit: 1,
    }
  );

  try {
    const res: any = await uni.request({
      url,
      method: "GET",
      data: requestData,
      header: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const mapped = mapCommentsResponse(res.data?.data);
      const updated = mapped[0];
      if (updated) {
        await hydrateUserReactions([updated]);
        const index = commentsList.value.findIndex(
          (item) => item.id === commentId
        );
        if (index >= 0) {
          commentsList.value.splice(index, 1, updated);
        }
        return updated;
      }
    }
  } catch (err) {
    console.error("refresh comment failed", err);
  }

  return null;
}

function isConflictError(err: any) {
  const message = String(err?.message || "");
  return message.includes("HTTP 409");
}

function isNotFoundError(err: any) {
  const message = String(err?.message || "");
  return message.includes("HTTP 404");
}

async function handleCommentLike(comment: CommentEntity) {
  if (!token.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  const userId = userStore.userInfo.id;
  if (!userId) {
    uni.showToast({ title: "缺少用户信息", icon: "none" });
    return;
  }

  if (reactionInFlight.has(comment.id)) {
    return;
  }

  const target = commentsList.value.find((item) => item.id === comment.id);
  if (!target) {
    return;
  }

  const hadLiked = target.myReaction === "like";
  const originalLikeCount = target.likeCount;
  const originalReaction = target.myReaction;
  const originalReactionId = target.myReactionId;

  target.likeCount = Math.max(0, target.likeCount + (hadLiked ? -1 : 1));
  target.myReaction = hadLiked ? "none" : "like";
  target.myReactionId = undefined;

  reactionInFlight.add(comment.id);

  try {
    if (hadLiked) {
      await deleteCommentReaction({
        apiBaseUrl: apiBaseUrl.value,
        token: token.value,
        ...(originalReactionId
          ? { reactionId: originalReactionId }
          : { commentId: comment.id, userId }),
      });
      target.myReactionId = undefined;
    } else {
      const res: any = await createCommentReaction({
        apiBaseUrl: apiBaseUrl.value,
        token: token.value,
        commentId: comment.id,
        userId,
        reaction: "like",
      });
      const createdId = res?.data?.id;
      if (createdId) {
        target.myReactionId = createdId;
      }
    }
  } catch (err: any) {
    console.error("toggle like failed", err);
    target.likeCount = originalLikeCount;
    target.myReaction = originalReaction;
    target.myReactionId = originalReactionId;
    if (!hadLiked && isConflictError(err)) {
      const refreshed = await refreshComment(comment.id);
      if (refreshed) {
        const toastMsg =
          refreshed.myReaction === "like" ? "已点赞" : "状态已同步";
        uni.showToast({ title: toastMsg, icon: "none" });
        return;
      }
    }

    if (hadLiked && isNotFoundError(err)) {
      const refreshed = await refreshComment(comment.id);
      if (refreshed) {
        uni.showToast({ title: "状态已同步", icon: "none" });
        return;
      }
    }

    const message = err?.message || "操作失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    reactionInFlight.delete(comment.id);
  }
}

function handleCommentReply(comment: CommentEntity) {
  console.log("[comment-reply]", comment);

  // 设置回复目标
  replyTarget.value = {
    id: comment.id,
    name: comment.author?.name || "用户",
  };

  // 显示回复输入框
  showReplyInput.value = true;
}

// 处理回复提交
async function handleReplySubmit(data: {
  text: string;
  replyTo: { id: string; name: string };
}) {
  if (!token.value) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  if (!contentId.value) {
    uni.showToast({ title: "缺少内容ID", icon: "none" });
    return;
  }

  console.log("[reply-submit]", data);

  try {
    // 获取父评论信息用于计算字段
    const parentComment = commentsList.value.find(
      (c) => c.id === data.replyTo.id
    );
    const parentRaw = (parentComment?.raw ?? {}) as Record<string, any>;
    const rootId = parentRaw?.root_comment_id ?? parentComment?.id ?? null;
    const depth = (parentRaw?.depth ?? 0) + 1;

    // 调用创建评论API
    const res: any = await uni.request({
      url: `${apiBaseUrl.value}/items/comments`,
      method: "POST",
      data: {
        // 核心用户输入字段
        content_id: contentId.value,
        parent_comment_id: data.replyTo.id,
        text: data.text,

        // 业务逻辑字段
        author_id: userStore.userInfo.id,
        target_id: contentId.value,
        target_collection: "contents",
        root_id: rootId,
        depth,
        type: "reply",
        status: "published",
      },
      header: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      uni.showToast({ title: "回复成功", icon: "success" });

      // 隐藏回复输入框
      showReplyInput.value = false;
      replyTarget.value = null;

      // 乐观更新：增加父评论的回复数
      const parentComment = commentsList.value.find(
        (c) => c.id === data.replyTo.id
      );
      if (parentComment) {
        parentComment.replyCount = (parentComment.replyCount || 0) + 1;
      }

      // 重新获取评论列表以显示新回复
      await fetchComments();
    } else {
      throw new Error(`HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`);
    }
  } catch (error: any) {
    console.error("[reply-submit-error]", error);
    const message = error?.message || "回复失败，请重试";
    uni.showToast({ title: message, icon: "error" });
    throw error; // 重新抛出错误，让ReplyInput组件处理
  }
}

// 处理回复取消
function handleReplyCancel() {
  showReplyInput.value = false;
  replyTarget.value = null;
}

/**
 * 将用户的点赞状态注入到评论数据中
 * 从reactions中查找当前用户的点赞记录，设置myReaction和myReactionId
 */
async function hydrateUserReactions(comments: CommentEntity[]) {
  // 如果用户未登录，跳过处理
  if (!userStore.userInfo.id || !token.value) {
    console.log("[hydrateUserReactions] 用户未登录，跳过处理");
    return;
  }

  const currentUserId = userStore.userInfo.id;
  console.log(
    "[hydrateUserReactions] 开始处理用户点赞状态，用户ID:",
    currentUserId
  );
  console.log("[hydrateUserReactions] 处理评论数量:", comments.length);

  // 遍历每条评论
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    console.log(
      `[hydrateUserReactions] 处理评论 ${i + 1}/${comments.length}, ID: ${
        comment.id
      }`
    );

    const rawReactions = Array.isArray((comment.raw as any)?.comment_reactions)
      ? ((comment.raw as any).comment_reactions as Array<{
          id?: string;
          reaction?: string | null;
          user_id?: string | null;
        }>)
      : [];

    if (!rawReactions.length) {
      console.log(
        `[hydrateUserReactions] 评论 ${comment.id} 没有reactions数据`
      );
      comment.myReaction = "none";
      comment.myReactionId = undefined;
      continue;
    }

    console.log(
      `[hydrateUserReactions] 评论 ${comment.id} 有 ${rawReactions.length} 个reactions`
    );

    const userReaction = rawReactions.find(
      (reaction) =>
        reaction.user_id === currentUserId && reaction.reaction === "like"
    );

    if (userReaction) {
      // 用户点赞过这条评论
      comment.myReaction = "like";
      comment.myReactionId = userReaction.id;
      console.log(
        `[hydrateUserReactions] ✓ 用户已点赞评论 ${comment.id}, reactionId: ${userReaction.id}`
      );
    } else {
      // 用户没有点赞过
      comment.myReaction = "none";
      comment.myReactionId = undefined;
      console.log(`[hydrateUserReactions] ○ 用户未点赞评论 ${comment.id}`);
    }
  }

  console.log("[hydrateUserReactions] 用户点赞状态处理完成");
}
</script>

<style scoped>
.detail-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
}
/* 区域1：原始卡片样式（复制自SocialFeedContent组件） */
.original-card-section {
  border-bottom: 8px solid #f5f5f5;
  background: white;
}
.post-card {
  margin-bottom: 0;
  padding: 16px;
  border-bottom: 0.5px solid #cccdcf;
  background: white;
  transition: background-color 0.2s ease;
}
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.user-info {
  display: flex;
  gap: 12px;
  flex: 1;
}
.avatar {
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
}
.avatar-image {
  border-radius: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 16px;
  color: white;
}
.user-details {
  flex: 1;
}
.user-name-time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}
.user-name {
  font-weight: 500;
  font-size: 16px;
  color: #00030f;
}
.post-time {
  font-size: 12px;
  color: #808187;
}
.user-title {
  line-height: 1.3;
  font-size: 12px;
  color: #808187;
}
.more-options {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: #808187;
  transition: background-color 0.2s ease;
}
.post-content {
  margin-bottom: 16px;
  line-height: 1.4;
  font-size: 14px;
  color: #00030f;
  white-space: pre-line;
}
.post-images {
  margin-bottom: 16px;
}
.image-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}
.image-item {
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: 6px;
  width: 200px;
  height: 200px;
  background: #f0f0f0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.image-placeholder {
  font-size: 48px;
  color: #cccdcf;
}
.actual-image {
  border-radius: 6px;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.action-group {
  display: flex;
  gap: 24px;
}
.action-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 4px;
}
.action-icon {
  font-size: 16px;
}
.action-count {
  font-size: 12px;
  color: #808187;
}
.share-group {
  display: flex;
  gap: 16px;
}
.share-icon,
.bookmark-icon {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
}
/* 区域2：评论调试 */
.detail-ui-section {
  display: flex;
  flex-direction: column;
  padding: 24px 16px 48px;
  background: white;
  gap: 16px;
}
.simple-text {
  font-weight: 600;
  font-size: 18px;
  color: #1f2937;
}
.comment-debug-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.debug-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.debug-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #34c759 0%, #2aa568 100%);
  font-size: 14px;
  color: #fff;
}
.debug-btn:disabled {
  opacity: 0.7;
}
.content-id-text {
  font-size: 13px;
  color: #4b5563;
}
.debug-block {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  gap: 8px;
}
.debug-block__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.debug-block__header.error {
  color: #c0392b;
}
.debug-block__title {
  font-weight: 600;
  font-size: 14px;
}
.copy-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: #e5edff;
  font-size: 12px;
  color: #1f2a62;
}
.copy-btn:disabled {
  opacity: 0.5;
}
.debug-textarea {
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  width: 100%;
  min-height: 110px;
  background: white;
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
  color: #1f2937;
}
.debug-textarea.error {
  border-color: #e74c3c;
  background: #fff5f3;
  color: #c0392b;
}
.comment-title {
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}
.comment-empty {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}
/* 响应式设计 */
@media (max-width: 768px) {
  .post-card {
    padding: 12px;
  }
  .image-item {
    width: 150px;
    height: 150px;
  }
  .action-group {
    gap: 16px;
  }
}
@media (max-width: 480px) {
  .post-card {
    padding: 8px;
  }
  .image-item {
    width: 120px;
    height: 120px;
  }
  .user-name {
    font-size: 14px;
  }
  .post-content {
    font-size: 13px;
  }
}
</style>
