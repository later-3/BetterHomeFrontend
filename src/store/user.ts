import { defineStore } from 'pinia';
import { readMe } from '@directus/sdk';
import directus, {
  setAuthToken,
  handleDirectusError,
  communitiesApi,
  buildingsApi
} from '@/utils/directus';
import type { Community, Building, DirectusUser } from '@/@types/directus-schema';

type UserFieldSelection =
  | keyof DirectusUser
  | '*'
  | 'community_id.*'
  | 'building_id.*'
  | 'avatar.*'
  | 'avatar.id'
  | 'avatar.filename_disk'
  | 'avatar.type';

const USER_PROFILE_FIELDS: UserFieldSelection[] = [
  'id',
  'first_name',
  'last_name',
  'email',
  'status',
  'language',
  'user_type',
  'community_id.*',
  'building_id.*',
  'avatar.*',
  'avatar.id',
  'avatar.filename_disk',
  'avatar.type'
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

function normalizeUserPayload(user: DirectusUser): NormalizedProfile {
  const community =
    typeof user.community_id === 'object' && user.community_id !== null
      ? (user.community_id as Community)
      : null;

  const building =
    typeof user.building_id === 'object' && user.building_id !== null
      ? (user.building_id as Building)
      : null;

  const profile: DirectusUser = {
    ...user,
    community_id: community ?? user.community_id,
    building_id: building ?? user.building_id ?? null,
    avatar: typeof user.avatar === 'object' || typeof user.avatar === 'string' ? user.avatar : null
  };

  return { profile, community, building };
}

function resolveExpiry(authData: { expires?: number | null; expires_at?: string | number | null }): number | null {
  const { expires_at, expires } = authData;

  if (typeof expires_at === 'number' && Number.isFinite(expires_at)) {
    return expires_at;
  }

  if (typeof expires_at === 'string') {
    const expiresAt = new Date(expires_at).getTime();
    if (!Number.isNaN(expiresAt)) {
      return expiresAt;
    }
  }

  if (typeof expires === 'number' && Number.isFinite(expires)) {
    return Date.now() + expires;
  }

  return null;
}

function createCommunityFromLegacy(payload: LegacyUserPayload): Community | null {
  if (!payload.community_id) return null;
  return {
    id: payload.community_id,
    name: payload.community_name ?? '',
    user_created: undefined,
    date_created: undefined,
    user_updated: undefined,
    date_updated: undefined,
    address: undefined
  };
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    refreshToken: '',
    tokenExpiry: null as number | null,
    profile: null as DirectusUser | null,
    community: null as Community | null,
    building: null as Building | null,
    loading: false
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.profile?.id),
    loggedIn(): boolean {
      return Boolean(this.token && this.profile?.id);
    },
    userId: (state) => state.profile?.id ?? '',
    userType: (state) => state.profile?.user_type ?? null,
    displayName: (state) => {
      if (!state.profile) return '';
      const { first_name, last_name, email } = state.profile;
      const name = [first_name, last_name].filter(Boolean).join(' ').trim();
      return name || email || state.profile.id;
    },
    communityId: (state) => {
      const value = state.profile?.community_id;
      if (!value) return '';
      return typeof value === 'string' ? value : value.id;
    },
    buildingId: (state) => {
      const value = state.profile?.building_id;
      if (!value) return '';
      return typeof value === 'string' ? value : value.id;
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
    userInfo: (state): {
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
        id: profile?.id ?? '',
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        email: profile?.email ?? '',
        community_id:
          typeof profile?.community_id === 'string'
            ? profile.community_id
            : profile?.community_id?.id ?? community?.id ?? '',
        community_name: community?.name ?? ''
      };
    }
  },
  actions: {
    async login(
      arg1: LoginCredentials | LegacyUserPayload,
      tokenArg?: string,
      expiryMinutes?: number
    ): Promise<DirectusUser | void> {
      if ('password' in arg1) {
        this.loading = true;
        try {
          const authData = await directus.login(arg1.email, arg1.password, { mode: 'json' });

          const accessToken = authData?.access_token ?? '';
          const refreshToken = authData?.refresh_token ?? '';
          const expiresAt = resolveExpiry(authData ?? {});

          this.token = accessToken;
          this.refreshToken = refreshToken;
          this.tokenExpiry = expiresAt;

          await setAuthToken(accessToken || null);

          const user = await directus.request(
            readMe({
              fields: USER_PROFILE_FIELDS as unknown as (keyof DirectusUser)[]
            })
          );

          if (import.meta.env.DEV) {
            console.log('[user-store] login readMe result', user);
          }

          const normalized = normalizeUserPayload(user as DirectusUser);
          this.profile = normalized.profile;
          this.community = normalized.community;
          this.building = normalized.building;

          if (!normalized.community || !normalized.building) {
            await this.fetchContext();
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
        this.token = tokenArg ?? '';
        this.refreshToken = '';
        this.tokenExpiry =
          typeof expiryMinutes === 'number'
            ? Date.now() + expiryMinutes * 60 * 1000
            : null;

        await setAuthToken(this.token || null);

        const fallbackProfile: DirectusUser = {
          id: legacy.id,
          first_name: legacy.first_name,
          last_name: legacy.last_name,
          email: legacy.email,
          community_id: legacy.community_id || '',
          building_id: legacy.building_id ?? null,
          user_type: this.profile?.user_type ?? 'resident'
        };

        this.profile = fallbackProfile;
        this.community = createCommunityFromLegacy(legacy);
        this.building = null;
      }
    },

    async fetchProfile() {
      if (!this.token) return null;
      try {
        const user = await directus.request(
          readMe({
            fields: USER_PROFILE_FIELDS as unknown as (keyof DirectusUser)[]
          })
        );

        if (import.meta.env.DEV) {
          console.log('[user-store] fetchProfile readMe result', user);
        }

        const normalized = normalizeUserPayload(user as DirectusUser);
        this.profile = normalized.profile;
        this.community = normalized.community;
        this.building = normalized.building;

        if (!normalized.community || !normalized.building) {
          await this.fetchContext();
        }

        return this.profile;
      } catch (error) {
        handleDirectusError(error);
      }
    },

    async fetchContext() {
      if (!this.profile?.community_id) return;

      const communityId =
        typeof this.profile.community_id === 'string'
          ? this.profile.community_id
          : this.profile.community_id.id;

      try {
        this.community = await communitiesApi.readOne(communityId, {
          fields: ['id', 'name', 'address']
        });
      } catch (error) {
        console.warn('[user-store] Failed to load community details', error);
      }

      const buildingRef = this.profile.building_id;
      if (!buildingRef) {
        this.building = null;
        return;
      }

      const buildingId = typeof buildingRef === 'string' ? buildingRef : buildingRef.id;
      if (!buildingId) {
        this.building = null;
        return;
      }

      try {
        this.building = await buildingsApi.readOne(buildingId, {
          fields: ['id', 'name', 'community_id']
        });
      } catch (error) {
        console.warn('[user-store] Failed to load building details', error);
      }
    },

    async refreshSession() {
      if (!this.refreshToken) return null;
      try {
        const authData = await directus.refresh();
        const accessToken = authData?.access_token ?? '';
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
        console.warn('[user-store] logout failed', error);
      } finally {
        await setAuthToken(null);
        this.$reset();
      }
    }
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user',
        storage: {
          getItem: (key: string) => uni.getStorageSync(key),
          setItem: (key: string, value: any) => uni.setStorageSync(key, value),
          removeItem: (key: string) => uni.removeStorageSync(key),
          clear: () => uni.clearStorageSync(),
          key: (_index: number) => '',
          get length() {
            return 0;
          }
        },
        paths: ['token', 'refreshToken', 'tokenExpiry', 'profile', 'community', 'building']
      }
    ]
  }
});

export default useUserStore;
