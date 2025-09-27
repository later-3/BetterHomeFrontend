import type { CommentAttachment, CommentEntity } from './types';

type AttachmentDto = {
  id?: string;
  directus_files_id?: {
    id?: string;
    type?: string | null;
    filename_download?: string | null;
    title?: string | null;
  } | null;
};

type AuthorDto = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  name?: string | null;
};

type CommentDto = {
  id?: string;
  text?: string | null;
  like_count?: number | null;
  replies_count?: number | null;
  date_created?: string | null;
  attachments?: AttachmentDto[] | null;
  author_id?: AuthorDto | null;
  comment_reactions?: Array<{
    id?: string;
    reaction?: string | null;
    user_id?: string | null;
  }> | null;
};

const UNKNOWN_AUTHOR = '匿名用户';

function resolveAttachmentType(mimeType: string | null | undefined): CommentAttachment['type'] {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

function mapAttachments(dto: CommentDto): CommentAttachment[] {
  if (!dto.attachments?.length) return [];

  return dto.attachments
    .map((attachment): CommentAttachment | null => {
      const file = attachment?.directus_files_id;
      if (!file?.id) return null;

      const type = resolveAttachmentType(file.type);

      const result: CommentAttachment = {
        id: attachment.id ?? file.id,
        fileId: file.id,
        type,
        mimeType: file.type ?? null,
        filename: file.filename_download ?? null,
        title: file.title ?? null
      };

      return result;
    })
    .filter((item): item is CommentAttachment => item !== null);
}

function extractAvatarFileId(avatar: any): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar || undefined;
  if (typeof avatar === 'object' && avatar.id) return avatar.id;
  return undefined;
}

function mapAuthor(dto: CommentDto): { id?: string; name: string; avatar?: string } {
  const author = dto.author_id;
  if (!author) {
    return {
      id: undefined,
      name: UNKNOWN_AUTHOR,
      avatar: undefined
    };
  }

  const { id, avatar } = author;
  const name =
    author.name ||
    [author.first_name, author.last_name].filter(Boolean).join(' ').trim() ||
    UNKNOWN_AUTHOR;

  return {
    id,
    name,
    avatar: extractAvatarFileId(avatar)
  };
}

export function mapCommentDtoToEntity(dto: CommentDto): CommentEntity {
  const id = dto.id ?? '';
  const firstReaction = dto.comment_reactions?.[0];
  const myReaction = firstReaction?.reaction === 'like' ? 'like' : 'none';

  return {
    id,
    author: mapAuthor(dto),
    createdAt: dto.date_created ?? '',
    text: dto.text ?? '',
    attachments: mapAttachments(dto),
    likeCount: Number(dto.like_count ?? 0),
    replyCount: Number(dto.replies_count ?? 0),
    myReaction,
    myReactionId: firstReaction?.id ?? undefined,
    raw: dto
  };
}

export function mapCommentsResponse(data: CommentDto[] | undefined | null): CommentEntity[] {
  if (!data?.length) return [];
  return data.map((item) => mapCommentDtoToEntity(item));
}
