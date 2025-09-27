import type { CommentReaction } from './types';

type RequestOptions = {
  apiBaseUrl: string;
  token: string;
};

type CreateReactionOptions = RequestOptions & {
  commentId: string;
  reaction: Extract<CommentReaction, 'like' | 'unlike'>;
  userId?: string;
};

type DeleteReactionByIdOptions = RequestOptions & {
  reactionId: string;
};

type DeleteReactionByFilterOptions = RequestOptions & {
  commentId: string;
  userId: string;
};

type DeleteReactionOptions = DeleteReactionByIdOptions | DeleteReactionByFilterOptions;

function ensureSuccess(res: UniApp.RequestSuccessCallbackResult): void {
  if (res.statusCode >= 200 && res.statusCode < 300) return;
  const payload = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  throw new Error(`HTTP ${res.statusCode}: ${payload}`);
}

export async function createCommentReaction(options: CreateReactionOptions) {
  const { apiBaseUrl, token, commentId, reaction, userId } = options;
  const url = `${apiBaseUrl}/items/comment_reactions`;
  const payload: Record<string, unknown> = {
    comment_id: commentId,
    reaction
  };

  if (userId) {
    payload.user_id = userId;
  }

  const res: UniApp.RequestSuccessCallbackResult = await uni.request({
    url,
    method: 'POST',
    data: payload,
    header: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  ensureSuccess(res);
  return res.data;
}

export async function deleteCommentReaction(options: DeleteReactionOptions) {
  const { apiBaseUrl, token } = options;

  if ('reactionId' in options && options.reactionId) {
    const url = `${apiBaseUrl}/items/comment_reactions/${options.reactionId}`;
    const res: UniApp.RequestSuccessCallbackResult = await uni.request({
      url,
      method: 'DELETE',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    ensureSuccess(res);
    return res.data;
  }

  const { commentId, userId } = options as DeleteReactionByFilterOptions;
  const query =
    `filter[comment_id][_eq]=${encodeURIComponent(commentId)}` +
    `&filter[user_id][_eq]=${encodeURIComponent(userId)}`;
  const url = `${apiBaseUrl}/items/comment_reactions?${query}`;

  const res: UniApp.RequestSuccessCallbackResult = await uni.request({
    url,
    method: 'DELETE',
    header: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  ensureSuccess(res);
  return res.data;
}
