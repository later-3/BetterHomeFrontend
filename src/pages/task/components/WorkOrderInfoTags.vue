<script setup lang="ts">
import { computed } from "vue";

type TagVariant =
  | "default"
  | "primary"
  | "warning"
  | "urgent"
  | "high"
  | "medium"
  | "low";

export interface WorkOrderTagItem {
  text: string;
  icon?: string;
  iconColor?: string;
  variant?: TagVariant;
}

const props = defineProps<{
  items?: WorkOrderTagItem[] | null;
}>();

interface VariantStyle {
  background: string;
  color: string;
  iconColor: string;
}

const VARIANT_STYLES: Record<TagVariant, VariantStyle> = {
  default: {
    background: "#f1f5f9",
    color: "#475569",
    iconColor: "#475569",
  },
  primary: {
    background: "#dcfce7",
    color: "#166534",
    iconColor: "#166534",
  },
  warning: {
    background: "#fdf2e2",
    color: "#b45309",
    iconColor: "#b45309",
  },
  urgent: {
    background: "#fee2e2",
    color: "#b91c1c",
    iconColor: "#b91c1c",
  },
  high: {
    background: "#fef3c7",
    color: "#b45309",
    iconColor: "#b45309",
  },
  medium: {
    background: "#dcfce7",
    color: "#166534",
    iconColor: "#166534",
  },
  low: {
    background: "#e0f2fe",
    color: "#1d4ed8",
    iconColor: "#1d4ed8",
  },
};

const normalizedItems = computed(() => {
  if (!Array.isArray(props.items)) return [];
  return props.items.filter((item): item is WorkOrderTagItem => Boolean(item && item.text));
});

const getVariant = (variant: TagVariant | undefined): TagVariant => {
  if (!variant || !(variant in VARIANT_STYLES)) return "default";
  return variant;
};

const getIconColor = (variant: TagVariant | undefined, iconColor?: string) => {
  if (iconColor) return iconColor;
  return VARIANT_STYLES[getVariant(variant)].iconColor;
};
</script>

<template>
  <view v-if="normalizedItems.length" class="info-tags">
    <view
      v-for="(item, index) in normalizedItems"
      :key="`${item.text}-${index}`"
      class="info-tag"
      :style="{
        background: VARIANT_STYLES[getVariant(item.variant)].background,
        color: VARIANT_STYLES[getVariant(item.variant)].color,
      }"
    >
      <up-icon
        v-if="item.icon"
        :name="item.icon"
        size="14"
        :color="getIconColor(item.variant, item.iconColor)"
      />
      <text class="info-tag-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<style scoped>
.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.info-tag {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 12px;
  color: #475569;
  gap: 4px;
}
.info-tag-text {
  color: inherit;
}
</style>
