import { defineStore } from "pinia";
import { readMe } from "@directus/sdk";
import directus, {
  setAuthToken,
  handleDirectusError,
  communitiesApi,
  buildingsApi,
} from "@/utils/directus";
import type {
  Community,
  Building,
  DirectusUser,
} from "@/@types/directus-schema";

type UserFieldSelection =
  | keyof DirectusUser
  | "*"
  | "community_id.*"
  | "building_id.*"
  | "avatar.*"
  | "avatar.id"
  | "avatar.filename_disk"
  | "avatar.type";

const USER_PROFILE_FIELDS: UserFieldSelection[] = [
  "id",
  "first_name",
  "last_name",
  "email",
  "status",
  "language",
  "user_type",
  "community_id.*",
  "building_id.*",
  "avatar.*",
  "avatar.id",
  "avatar.filename_disk",
  "avatar.type",
];

export interface LoginCredentials {
  email: string;
  password: string;
}

interface LegacyUserPayload {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  community_id: string;
  community_name?: string;
  building_id?: string | null;
}

interface NormalizedProfile {
  profile: DirectusUser;
  community: Community | null;
  building: Building | null;
}

let refreshSessionPromise: Promise<any> | null = null;

function resolveCommunityId(value: DirectusUser["community_id"]): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as Record<string, any>;
  return (
    record.id ??
    record.community_id ??
    record.uuid ??
    record._id ??
    ""
  );
}

function resolveBuildingId(value: DirectusUser["building_id"]): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as Record<string, any>;
  return record.id ?? record.building_id ?? record.uuid ?? record._id ?? "";
}

function normalizeUserPayload(user: DirectusUser): NormalizedProfile {
  const communityId = resolveCommunityId(user.community_id);
  const buildingId = resolveBuildingId(user.building_id);

  let community: Community | null = null;
  if (typeof user.community_id === "object" && user.community_id !== null) {
    const raw = user.community_id as Community;
    community = communityId && raw?.id !== communityId
      ? ({ ...raw, id: communityId } as Community)
      : (raw as Community);
  }

  let building: Building | null = null;
  if (typeof user.building_id === "object" && user.building_id !== null) {
    const raw = user.building_id as Building;
    building = buildingId && raw?.id !== buildingId
      ? ({ ...raw, id: buildingId } as Building)
      : (raw as Building);
  }

  const profileCommunity =
    typeof user.community_id === "object" && user.community_id !== null
      ? (communityId
          ? ({
              ...(user.community_id as Record<string, any>),
              id: communityId,
            } as Community)
          : (user.community_id as Community))
      : communityId || user.community_id;

  const profileBuilding =
    typeof user.building_id === "object" && user.building_id !== null
      ? (buildingId
          ? ({
              ...(user.building_id as Record<string, any>),
              id: buildingId,
            } as Building)
          : (user.building_id as Building))
      : (buildingId ? buildingId : user.building_id ?? null);

  const profile: DirectusUser = {
    ...user,
    community_id: profileCommunity,
    building_id: profileBuilding,
    avatar:
      typeof user.avatar === "object" || typeof user.avatar === "string"
        ? user.avatar
        : null,
  };

  return { profile, community, building };
}

function resolveExpiry(authData: {
  expires?: number | null;
  expires_at?: string | number | null;
}): number | null {
  const { expires_at, expires } = authData;

  if (typeof expires_at === "number" && Number.isFinite(expires_at)) {
    return expires_at;
  }

  if (typeof expires_at === "string") {
    const expiresAt = new Date(expires_at).getTime();
    if (!Number.isNaN(expiresAt)) {
      return expiresAt;
    }
  }

  if (typeof expires === "number" && Number.isFinite(expires)) {
    return Date.now() + expires;
  }

  return null;
}

function createCommunityFromLegacy(
  payload: LegacyUserPayload
): Community | null {
  if (!payload.community_id) return null;
  return {
    id: payload.community_id,
    name: payload.community_name ?? "",
    user_created: undefined,
    date_created: undefined,
    user_updated: undefined,
    date_updated: undefined,
    address: undefined,
  };
}

export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    refreshToken: "",
    tokenExpiry: null as number | null,
    profile: null as DirectusUser | null,
    community: null as Community | null,
    building: null as Building | null,
    loading: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.profile?.id),
    loggedIn(): boolean {
      return Boolean(this.token && this.profile?.id);
    },
    userId: (state) => state.profile?.id ?? "",
    userType: (state) => state.profile?.user_type ?? null,
    displayName: (state) => {
      if (!state.profile) return "";
      const { first_name, last_name, email } = state.profile;
      const name = [first_name, last_name].filter(Boolean).join(" ").trim();
      return name || email || state.profile.id;
    },
    communityId: (state) => {
      const fromProfile = resolveCommunityId(state.profile?.community_id ?? null);
      const fromCommunity = state.community?.id ?? "";
      return fromProfile || fromCommunity || "";
    },
    buildingId: (state) => {
      const value = state.profile?.building_id;
      if (!value) return "";
      return typeof value === "string" ? value : value.id;
    },
    tokenNearExpiry: (state) => {
      if (!state.tokenExpiry) return false;
      const warningThreshold = state.tokenExpiry - 5 * 60 * 1000;
      return Date.now() >= warningThreshold;
    },
    tokenExpired: (state) => {
      if (!state.tokenExpiry) return false;
      return Date.now() >= state.tokenExpiry;
    },
    userInfo: (
      state
    ): {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      community_id: string;
      community_name: string;
    } => {
      const profile = state.profile;
      const community = state.community;
      return {
        id: profile?.id ?? "",
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        email: profile?.email ?? "",
        community_id:
          resolveCommunityId(profile?.community_id ?? null) || community?.id || "",
        community_name: community?.name ?? "",
      };
    },
  },
  actions: {
    async login(
      arg1: LoginCredentials | LegacyUserPayload,
      tokenArg?: string,
      expiryMinutes?: number
    ): Promise<DirectusUser | void> {
      if ("password" in arg1) {
        this.loading = true;
        try {
          const authData = await directus.login(arg1.email, arg1.password, {
            mode: "json",
          });

          const accessToken = authData?.access_token ?? "";
          const refreshToken = authData?.refresh_token ?? "";
          const expiresAt = resolveExpiry(authData ?? {});

          this.token = accessToken;
          this.refreshToken = refreshToken;
          this.tokenExpiry = expiresAt;

          await setAuthToken(accessToken || null);

          const user = await directus.request(
            readMe({
              fields: USER_PROFILE_FIELDS as unknown as (keyof DirectusUser)[],
            })
          );

          if (import.meta.env.DEV) {
            console.log("[user-store] login readMe result", user);
          }

          const normalized = normalizeUserPayload(user as DirectusUser);
          this.profile = normalized.profile;
          this.community = normalized.community;
          this.building = normalized.building;

          if (!normalized.community || !normalized.building) {
            // 使用setTimeout避免同步调用导致的递归
            setTimeout(() => {
              if (!this.loading) {
                this.fetchContext();
              }
            }, 0);
          }

          return this.profile;
        } catch (error) {
          await setAuthToken(null);
          this.$reset();
          handleDirectusError(error);
        } finally {
          this.loading = false;
        }
      } else {
        const legacy = arg1;
        this.token = tokenArg ?? "";
        this.refreshToken = "";
        this.tokenExpiry =
          typeof expiryMinutes === "number"
            ? Date.now() + expiryMinutes * 60 * 1000
            : null;

        await setAuthToken(this.token || null);

        const fallbackProfile: DirectusUser = {
          id: legacy.id,
          first_name: legacy.first_name,
          last_name: legacy.last_name,
          email: legacy.email,
          community_id: legacy.community_id || "",
          building_id: legacy.building_id ?? null,
          user_type: this.profile?.user_type ?? "resident",
        };

        this.profile = fallbackProfile;
        this.community = createCommunityFromLegacy(legacy);
        this.building = null;
      }
    },

    async fetchProfile() {
      if (!this.token) return null;

      // 防止重复调用
      if (this.loading) {
        console.log("[user-store] fetchProfile 已在执行中，跳过重复调用");
        return this.profile;
      }

      this.loading = true;

      try {
        const user = await directus.request(
          readMe({
            fields: USER_PROFILE_FIELDS as unknown as (keyof DirectusUser)[],
          })
        );

        if (import.meta.env.DEV) {
          console.log("[user-store] fetchProfile readMe result", user);
        }

        const normalized = normalizeUserPayload(user as DirectusUser);
        this.profile = normalized.profile;
        this.community = normalized.community;
        this.building = normalized.building;

        // 只有在社区或建筑信息缺失且不在加载状态时才调用fetchContext
        if (!normalized.community || !normalized.building) {
          // 使用setTimeout避免同步调用导致的递归
          setTimeout(() => {
            if (!this.loading) {
              this.fetchContext();
            }
          }, 0);
        }

        return this.profile;
      } catch (error) {
        handleDirectusError(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchContext() {
      if (!this.profile?.community_id) return;

      // 防止无限递归：如果正在加载中，直接返回
      if (this.loading) {
        console.log("[user-store] fetchContext 已在执行中，跳过重复调用");
        return;
      }

      this.loading = true;

      try {
        // 修复：从 community_id 对象中查找实际的 ID
        let communityId: string | undefined;

        if (typeof this.profile.community_id === "string") {
          communityId = this.profile.community_id;
        } else if (
          this.profile.community_id &&
          typeof this.profile.community_id === "object"
        ) {
          // 尝试从对象中获取 ID，可能的字段名
          communityId =
            (this.profile.community_id as any).id ||
            (this.profile.community_id as any).community_id ||
            (this.profile.community_id as any).uuid;
        }

        // 如果仍然没有找到 ID，尝试通过名称查找社区
        if (
          !communityId &&
          this.profile.community_id &&
          typeof this.profile.community_id === "object"
        ) {
          const communityName = (this.profile.community_id as any).name;
          if (communityName) {
            try {
              console.log("[user-store] 尝试通过社区名称查找:", communityName);
              const communities = await communitiesApi.readMany({
                filter: { name: { _eq: communityName } },
                fields: ["id", "name", "address"],
                limit: 1,
              });

              if (communities.length > 0) {
                communityId = communities[0].id;
                console.log("[user-store] 通过名称找到社区ID:", communityId);
                // 更新社区信息，添加缺失的ID
                this.community = communities[0];
              }
            } catch (error) {
              console.warn("[user-store] 通过名称查找社区失败:", error);
            }
          }
        }

        if (!communityId) {
          console.warn(
            "[user-store] 无法获取社区ID，community_id对象:",
            this.profile.community_id
          );
          return;
        }

        try {
          this.community = await communitiesApi.readOne(communityId, {
            fields: ["id", "name", "address"],
          });
          console.log("[user-store] 成功加载社区信息:", this.community);
        } catch (error) {
          console.warn("[user-store] Failed to load community details", error);
        }

        if (communityId && this.profile) {
          if (
            this.profile.community_id &&
            typeof this.profile.community_id === "object"
          ) {
            this.profile = {
              ...this.profile,
              community_id: {
                ...(this.profile.community_id as Record<string, any>),
                id: communityId,
              } as Community,
            };
          } else {
            this.profile = {
              ...this.profile,
              community_id: communityId,
            };
          }
        }

        const buildingRef = this.profile.building_id;
        if (!buildingRef) {
          this.building = null;
          return;
        }

        const buildingId =
          typeof buildingRef === "string" ? buildingRef : buildingRef.id;
        if (!buildingId) {
          this.building = null;
          return;
        }

        try {
          this.building = await buildingsApi.readOne(buildingId, {
            fields: ["id", "name", "community_id"],
          });
        } catch (error) {
          console.warn("[user-store] Failed to load building details", error);
        }
      } finally {
        this.loading = false;
      }
    },

    async refreshSession() {
      if (!this.refreshToken) return null;
      try {
        const authData = await directus.refresh();
        const accessToken = authData?.access_token ?? "";
        const refreshToken = authData?.refresh_token ?? this.refreshToken;
        const expiresAt = resolveExpiry(authData ?? {});

        this.token = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = expiresAt;

        await setAuthToken(accessToken || null);
        return authData;
      } catch (error) {
        await this.logout();
        handleDirectusError(error);
      }
    },

    async ensureActiveSession(options?: {
      force?: boolean;
      refreshIfNearExpiry?: boolean;
    }): Promise<boolean> {
      const { force = false, refreshIfNearExpiry = true } = options ?? {};

      if (!this.token) {
        return false;
      }

      const shouldRefresh =
        force || this.tokenExpired || (refreshIfNearExpiry && this.tokenNearExpiry);

      if (!shouldRefresh) {
        await setAuthToken(this.token);
        return true;
      }

      if (!this.refreshToken) {
        await this.logout();
        return false;
      }

      if (!refreshSessionPromise) {
        refreshSessionPromise = this.refreshSession().finally(() => {
          refreshSessionPromise = null;
        });
      }

      await refreshSessionPromise;
      return Boolean(this.token);
    },

    async hydrate() {
      if (!this.token) return;
      await setAuthToken(this.token);
      if (!this.profile) {
        await this.fetchProfile();
      } else if (!this.community) {
        await this.fetchContext();
      }
    },

    async logout() {
      try {
        await directus.logout();
      } catch (error) {
        console.warn("[user-store] logout failed", error);
      } finally {
        await setAuthToken(null);
        this.$reset();
      }
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: "user",
        storage: {
          getItem: (key: string) => uni.getStorageSync(key),
          setItem: (key: string, value: any) => uni.setStorageSync(key, value),
          removeItem: (key: string) => uni.removeStorageSync(key),
          clear: () => uni.clearStorageSync(),
          key: (_index: number) => "",
          get length() {
            return 0;
          },
        },
        paths: [
          "token",
          "refreshToken",
          "tokenExpiry",
          "profile",
          "community",
          "building",
        ],
      },
    ],
  },
});

export default useUserStore;
