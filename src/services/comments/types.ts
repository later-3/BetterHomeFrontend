export type CommentReaction = 'like' | 'none';

export type CommentAttachmentType = 'image' | 'video' | 'audio' | 'file';

export interface CommentAttachment {
  id: string;
  fileId: string;
  type: CommentAttachmentType;
  mimeType?: string | null;
  filename?: string | null;
  title?: string | null;
}

export interface CommentAuthor {
  id?: string | null;
  name: string;
  avatar?: string | null;
}

export interface CommentEntity {
  id: string;
  author: CommentAuthor;
  createdAt: string;
  text: string;
  attachments: CommentAttachment[];
  likeCount: number;
  replyCount: number;
  myReaction: CommentReaction;
  myReactionId?: string | null;
  raw?: unknown;
}
