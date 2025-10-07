export interface Announcement {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  title: string;
  /** @required */
  content: string;
  /** @required */
  author_id: DirectusUser | string;
  community_id?: Community | string | null;
  building_id?: Building | string | null;
  is_pinned?: boolean | null;
  status?: "published" | "draft" | null;
  tags?: string[] | null;
  total_comments_count?: number | null;
  like_count?: number | null;
  files?: AnnouncementsDirectusFile[] | string[];
}

export interface AnnouncementsDirectusFile {
  /** @primaryKey */
  id: number;
  announcements_id?: Announcement | string | null;
  directus_files_id?: DirectusFile | string | null;
  sort?: number | null;
}

export interface Building {
  /** @primaryKey */
  id: string;
  /** @required */
  name: string;
  /** @required */
  community_id: Community | string;
}

export interface Comment {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  parent_id?: string | null;
  parent_type?:
    | "post"
    | "announcement"
    | "work_order"
    | "work_order_node"
    | null;
  parent_comment_id?: Comment | string | null;
  root_comment_id?: string | null;
  depth?: number | null;
  content?: string | null;
  like_count?: number | null;
  replies_count?: number | null;
  last_reply_at?: string | null;
  author_id?: DirectusUser | string | null;
  files?: CommentsDirectusFile[] | string[];
}

export interface CommentsDirectusFile {
  /** @primaryKey */
  id: number;
  comments_id?: Comment | string | null;
  directus_files_id?: DirectusFile | string | null;
  sort?: number | null;
}

export interface Community {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  name: string;
  address?: string | null;
}

export interface Post {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  title: string;
  /** @required */
  content: string;
  community_id?: Community | string | null;
  building_id?: Building | string | null;
  total_comments_count?: number | null;
  like_count?: number | null;
  /** @required */
  author_id: DirectusUser | string;
  status?: "published" | "draft" | null;
  is_pinned?: boolean | null;
  tags?: string[] | null;
  deleted_at?: string | null;
  cover_file_id?: DirectusFile | string | null;
  files?: PostsDirectusFile[] | string[];
}

export interface PostsDirectusFile {
  /** @primaryKey */
  id: number;
  posts_id?: Post | string | null;
  directus_files_id?: DirectusFile | string | null;
  sort?: number | null;
}

export interface Reaction {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  parent_id: string;
  parent_type?: "comment" | "post" | null;
  author_id?: DirectusUser | string | null;
  reaction_type?: "like" | null;
}

export interface WorkOrderNode {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  work_order_id?: WorkOrder | string | null;
  description?: string | null;
  node_type?:
    | "submitted"
    | "accepted"
    | "in_progress"
    | "resolved"
    | "updated_by_submitter"
    | "updated_by_assignee"
    | null;
  actor_id?: DirectusUser | string | null;
  files?: WorkOrderNodesDirectusFile[] | string[];
}

export interface WorkOrderNodesDirectusFile {
  /** @primaryKey */
  id: number;
  work_order_nodes_id?: WorkOrderNode | string | null;
  directus_files_id?: DirectusFile | string | null;
  sort?: number | null;
  status?: "pending" | "approved" | "rejected" | null;
}

export interface WorkOrder {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  title: string;
  /** @required */
  description: string;
  category?:
    | "repair"
    | "complaint"
    | "suggestion"
    | "inquiry"
    | "maintenance_fund_application"
    | "other"
    | null;
  priority?: "low" | "medium" | "high" | "urgent" | null;
  status?:
    | "submitted"
    | "accepted"
    | "in_progress"
    | "resolved"
    | "closed"
    | null;
  deadline?: string | null;
  resolved_at?: string | null;
  submitter_id?: DirectusUser | string | null;
  assignee_id?: DirectusUser | string | null;
  community_id?: Community | string | null;
  rating?: number | null;
  feedback?: string | null;
  files?: WorkOrdersDirectusFile[] | string[];
}

export interface WorkOrdersDirectusFile {
  /** @primaryKey */
  id: number;
  work_orders_id?: WorkOrder | string | null;
  directus_files_id?: DirectusFile | string | null;
  sort?: number | null;
}

// ============================================================
// Finance v2.0 Interfaces
// ============================================================

// 物业费账单 (应收)
export interface Billing {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  community_id: Community | string;
  building_id?: Building | string | null;
  /** @required */
  owner_id: DirectusUser | string;
  /** @required */
  period: string;
  /** @required */
  billing_amount: number;
  area?: number | null;
  unit_price?: number | null;
  /** @required */
  status: "unpaid" | "paid" | "partial" | "overdue";
  paid_amount?: number | null;
  due_date?: string | null;
  late_fee?: number | null;
  notes?: string | null;
  date_deleted?: string | null;
}

// 物业费收款记录 (实收)
export interface BillingPayment {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  billing_id: Billing | string;
  /** @required */
  community_id: Community | string;
  /** @required */
  owner_id: DirectusUser | string;
  /** @required */
  amount: number;
  /** @required */
  paid_at: string;
  /** @required */
  payment_method: "wechat" | "alipay" | "bank" | "cash" | "pos" | "other";
  payer_name?: string | null;
  payer_phone?: string | null;
  transaction_no?: string | null;
  proof_files?: string[] | null;
  notes?: string | null;
  date_deleted?: string | null;
}

// 其他收入 (公共收益)
export interface Income {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  community_id: Community | string;
  /** @required */
  income_type:
    | "advertising"
    | "parking"
    | "venue_rental"
    | "vending"
    | "express_locker"
    | "recycling"
    | "other";
  /** @required */
  title: string;
  description?: string | null;
  /** @required */
  amount: number;
  /** @required */
  income_date: string;
  period?: string | null;
  /** @required */
  payment_method: "wechat" | "alipay" | "bank" | "cash" | "pos" | "other";
  transaction_no?: string | null;
  related_info?: Record<string, any> | null;
  proof_files?: string[] | null;
  notes?: string | null;
  date_deleted?: string | null;
}

// 维修基金账户
export interface MaintenanceFundAccount {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  community_id: Community | string;
  /** @required */
  building_id: Building | string;
  /** @required */
  owner_id: DirectusUser | string;
  house_area?: number | null;
  unit_number?: string | null;
  /** @required */
  total_paid: number;
  /** @required */
  total_used: number;
  /** @required */
  balance: number;
  last_payment_date?: string | null;
  date_deleted?: string | null;
}

// 维修基金缴纳记录
export interface MaintenanceFundPayment {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  account_id: MaintenanceFundAccount | string;
  /** @required */
  community_id: Community | string;
  /** @required */
  owner_id: DirectusUser | string;
  /** @required */
  amount: number;
  /** @required */
  paid_at: string;
  /** @required */
  payment_method: "wechat" | "alipay" | "bank" | "cash" | "pos" | "other";
  payment_type?: "initial" | "replenishment" | "supplement" | null;
  transaction_no?: string | null;
  proof_files?: string[] | null;
  notes?: string | null;
  date_deleted?: string | null;
}

// 维修基金使用记录
export interface MaintenanceFundUsage {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  work_order_id: WorkOrder | string;
  /** @required */
  community_id: Community | string;
  /** @required */
  project_name: string;
  /** @required */
  project_type:
    | "elevator"
    | "exterior_wall"
    | "roof"
    | "pipeline"
    | "fire_system"
    | "security_system"
    | "road"
    | "other";
  /** @required */
  description: string;
  contractor?: string | null;
  contract_no?: string | null;
  estimated_amount?: number | null;
  actual_amount?: number | null;
  /** @required */
  approval_status: "pending" | "approved" | "rejected" | "completed";
  approved_by?: DirectusUser | string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  usage_date?: string | null;
  expense_id?: Expense | string | null;
  proof_files?: string[] | null;
  date_deleted?: string | null;
}

// 支出记录
export interface Expense {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  community_id: Community | string;
  /** @required */
  expense_type:
    | "salary"
    | "maintenance"
    | "utilities"
    | "materials"
    | "activity"
    | "committee_fund"
    | "maintenance_fund"
    | "other";
  /** @required */
  title: string;
  description?: string | null;
  /** @required */
  amount: number;
  /** @required */
  paid_at: string;
  period?: string | null;
  /** @required */
  payment_method: "wechat" | "alipay" | "bank" | "cash" | "pos" | "other";
  category?: string | null;
  related_info?: Record<string, any> | null;
  /** @required */
  status: "pending" | "approved" | "rejected";
  approved_by?: DirectusUser | string | null;
  approved_at?: string | null;
  proof_files?: string[] | null;
  /** @required */
  created_by: DirectusUser | string;
  date_deleted?: string | null;
}

// 员工信息
export interface Employee {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  community_id: Community | string;
  /** @required */
  name: string;
  phone?: string | null;
  id_card_last4?: string | null;
  /** @required */
  position_type:
    | "security"
    | "cleaning"
    | "management"
    | "electrician"
    | "plumber"
    | "gardener"
    | "temp_worker"
    | "other";
  position_title?: string | null;
  /** @required */
  employment_status: "active" | "resigned" | "on_leave" | "suspended";
  /** @required */
  hire_date: string;
  resignation_date?: string | null;
  base_salary?: number | null;
  notes?: string | null;
}

// 工资发放记录
export interface SalaryRecord {
  /** @primaryKey */
  id: string;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  employee_id: Employee | string;
  /** @required */
  community_id: Community | string;
  /** @required */
  period: string;
  /** @required */
  base_salary: number;
  bonus?: number | null;
  subsidy?: number | null;
  deduction?: number | null;
  social_security?: number | null;
  housing_fund?: number | null;
  /** @required */
  actual_amount: number;
  /** @required */
  payment_date: string;
  /** @required */
  payment_method: "wechat" | "alipay" | "bank" | "cash" | "pos" | "other";
  expense_id?: Expense | string | null;
  proof_files?: string[] | null;
}

export interface DirectusAccess {
  /** @primaryKey */
  id: string;
  role?: DirectusRole | string | null;
  user?: DirectusUser | string | null;
  policy?: DirectusPolicy | string;
  sort?: number | null;
}

export interface DirectusActivity {
  /** @primaryKey */
  id: number;
  action?: string;
  user?: DirectusUser | string | null;
  timestamp?: string;
  ip?: string | null;
  user_agent?: string | null;
  collection?: string;
  item?: string;
  origin?: string | null;
  revisions?: DirectusRevision[] | string[];
}

export interface DirectusCollection {
  /** @primaryKey */
  collection: string;
  icon?: string | null;
  note?: string | null;
  display_template?: string | null;
  hidden?: boolean;
  singleton?: boolean;
  translations?: Array<{
    language: string;
    translation: string;
    singular: string;
    plural: string;
  }> | null;
  archive_field?: string | null;
  archive_app_filter?: boolean;
  archive_value?: string | null;
  unarchive_value?: string | null;
  sort_field?: string | null;
  accountability?: "all" | "activity" | null | null;
  color?: string | null;
  item_duplication_fields?: "json" | null;
  sort?: number | null;
  group?: DirectusCollection | string | null;
  collapse?: string;
  preview_url?: string | null;
  versioning?: boolean;
}

export interface DirectusComment {
  /** @primaryKey */
  id: string;
  collection?: DirectusCollection | string;
  item?: string;
  comment?: string;
  date_created?: string | null;
  date_updated?: string | null;
  user_created?: DirectusUser | string | null;
  user_updated?: DirectusUser | string | null;
}

export interface DirectusField {
  /** @primaryKey */
  id: number;
  collection?: DirectusCollection | string;
  field?: string;
  special?: string[] | null;
  interface?: string | null;
  options?: "json" | null;
  display?: string | null;
  display_options?: "json" | null;
  readonly?: boolean;
  hidden?: boolean;
  sort?: number | null;
  width?: string | null;
  translations?: "json" | null;
  note?: string | null;
  conditions?: "json" | null;
  required?: boolean | null;
  group?: DirectusField | string | null;
  validation?: "json" | null;
  validation_message?: string | null;
}

export interface DirectusFile {
  /** @primaryKey */
  id: string;
  storage?: string;
  filename_disk?: string | null;
  filename_download?: string;
  title?: string | null;
  type?: string | null;
  folder?: DirectusFolder | string | null;
  uploaded_by?: DirectusUser | string | null;
  created_on?: string;
  modified_by?: DirectusUser | string | null;
  modified_on?: string;
  charset?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  embed?: string | null;
  description?: string | null;
  location?: string | null;
  tags?: string[] | null;
  metadata?: "json" | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  tus_id?: string | null;
  tus_data?: "json" | null;
  uploaded_on?: string | null;
}

export interface DirectusFolder {
  /** @primaryKey */
  id: string;
  name?: string;
  parent?: DirectusFolder | string | null;
}

export interface DirectusMigration {
  /** @primaryKey */
  version: string;
  name?: string;
  timestamp?: string | null;
}

export interface DirectusPermission {
  /** @primaryKey */
  id: number;
  collection?: string;
  action?: string;
  permissions?: "json" | null;
  validation?: "json" | null;
  presets?: "json" | null;
  fields?: string[] | null;
  policy?: DirectusPolicy | string;
}

export interface DirectusPolicy {
  /** @primaryKey */
  id: string;
  /** @required */
  name: string;
  icon?: string;
  description?: string | null;
  ip_access?: string[] | null;
  enforce_tfa?: boolean;
  admin_access?: boolean;
  app_access?: boolean;
  permissions?: DirectusPermission[] | string[];
  users?: DirectusAccess[] | string[];
  roles?: DirectusAccess[] | string[];
}

export interface DirectusPreset {
  /** @primaryKey */
  id: number;
  bookmark?: string | null;
  user?: DirectusUser | string | null;
  role?: DirectusRole | string | null;
  collection?: string | null;
  search?: string | null;
  layout?: string | null;
  layout_query?: "json" | null;
  layout_options?: "json" | null;
  refresh_interval?: number | null;
  filter?: "json" | null;
  icon?: string | null;
  color?: string | null;
}

export interface DirectusRelation {
  /** @primaryKey */
  id: number;
  many_collection?: string;
  many_field?: string;
  one_collection?: string | null;
  one_field?: string | null;
  one_collection_field?: string | null;
  one_allowed_collections?: string[] | null;
  junction_field?: string | null;
  sort_field?: string | null;
  one_deselect_action?: string;
}

export interface DirectusRevision {
  /** @primaryKey */
  id: number;
  activity?: DirectusActivity | string;
  collection?: string;
  item?: string;
  data?: "json" | null;
  delta?: "json" | null;
  parent?: DirectusRevision | string | null;
  version?: DirectusVersion | string | null;
}

export interface DirectusRole {
  /** @primaryKey */
  id: string;
  /** @required */
  name: string;
  icon?: string;
  description?: string | null;
  parent?: DirectusRole | string | null;
  children?: DirectusRole[] | string[];
  policies?: DirectusAccess[] | string[];
  users?: DirectusUser[] | string[];
}

export interface DirectusSession {
  /** @primaryKey */
  token: string;
  user?: DirectusUser | string | null;
  expires?: string;
  ip?: string | null;
  user_agent?: string | null;
  share?: DirectusShare | string | null;
  origin?: string | null;
  next_token?: string | null;
}

export interface DirectusSettings {
  /** @primaryKey */
  id: number;
  project_name?: string;
  project_url?: string | null;
  project_color?: string;
  project_logo?: DirectusFile | string | null;
  public_foreground?: DirectusFile | string | null;
  public_background?: DirectusFile | string | null;
  public_note?: string | null;
  auth_login_attempts?: number | null;
  auth_password_policy?:
    | null
    | `/^.{8,}$/`
    | `/(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{';'?>.<,])(?!.*\\s).*$/`
    | null;
  storage_asset_transform?: "all" | "none" | "presets" | null;
  storage_asset_presets?: Array<{
    key: string;
    fit: "contain" | "cover" | "inside" | "outside";
    width: number;
    height: number;
    quality: number;
    withoutEnlargement: boolean;
    format: "auto" | "jpeg" | "png" | "webp" | "tiff" | "avif";
    transforms: "json";
  }> | null;
  custom_css?: string | null;
  storage_default_folder?: DirectusFolder | string | null;
  basemaps?: Array<{
    name: string;
    type: "raster" | "tile" | "style";
    url: string;
    tileSize: number;
    attribution: string;
  }> | null;
  mapbox_key?: string | null;
  module_bar?: "json" | null;
  project_descriptor?: string | null;
  default_language?: string;
  custom_aspect_ratios?: Array<{ text: string; value: number }> | null;
  public_favicon?: DirectusFile | string | null;
  default_appearance?: "auto" | "light" | "dark";
  default_theme_light?: string | null;
  theme_light_overrides?: "json" | null;
  default_theme_dark?: string | null;
  theme_dark_overrides?: "json" | null;
  report_error_url?: string | null;
  report_bug_url?: string | null;
  report_feature_url?: string | null;
  public_registration?: boolean;
  public_registration_verify_email?: boolean;
  public_registration_role?: DirectusRole | string | null;
  public_registration_email_filter?: "json" | null;
  visual_editor_urls?: Array<{ url: string }> | null;
  accepted_terms?: boolean | null;
  project_id?: string | null;
  mcp_enabled?: boolean;
  mcp_allow_deletes?: boolean;
  mcp_prompts_collection?: string | null;
  mcp_system_prompt_enabled?: boolean;
  mcp_system_prompt?: string | null;
}

export interface DirectusUser {
  /** @primaryKey */
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  password?: string | null;
  location?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  avatar?: DirectusFile | string | null;
  language?: string | null;
  tfa_secret?: string | null;
  status?:
    | "draft"
    | "invited"
    | "unverified"
    | "active"
    | "suspended"
    | "archived";
  role?: DirectusRole | string | null;
  token?: string | null;
  last_access?: string | null;
  last_page?: string | null;
  provider?: string;
  external_identifier?: string | null;
  auth_data?: "json" | null;
  email_notifications?: boolean | null;
  appearance?: null | "auto" | "light" | "dark" | null;
  theme_dark?: string | null;
  theme_light?: string | null;
  theme_light_overrides?: "json" | null;
  theme_dark_overrides?: "json" | null;
  text_direction?: "auto" | "ltr" | "rtl";
  /** @required */
  community_id: Community | string;
  building_id?: Building | string | null;
  /** @required */
  user_type:
    | "resident"
    | "property_manager"
    | "committee_member"
    | "admin"
    | "property_woker"
    | "committee_normal";
  policies?: DirectusAccess[] | string[];
}

export interface DirectusWebhook {
  /** @primaryKey */
  id: number;
  name?: string;
  method?: null;
  url?: string;
  status?: "active" | "inactive";
  data?: boolean;
  actions?: "create" | "update" | "delete";
  collections?: string[];
  headers?: Array<{ header: string; value: string }> | null;
  was_active_before_deprecation?: boolean;
  migrated_flow?: DirectusFlow | string | null;
}

export interface DirectusDashboard {
  /** @primaryKey */
  id: string;
  name?: string;
  icon?: string;
  note?: string | null;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
  color?: string | null;
  panels?: DirectusPanel[] | string[];
}

export interface DirectusPanel {
  /** @primaryKey */
  id: string;
  dashboard?: DirectusDashboard | string;
  name?: string | null;
  icon?: string | null;
  color?: string | null;
  show_header?: boolean;
  note?: string | null;
  type?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  options?: "json" | null;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
}

export interface DirectusNotification {
  /** @primaryKey */
  id: number;
  timestamp?: string | null;
  status?: string | null;
  recipient?: DirectusUser | string;
  sender?: DirectusUser | string | null;
  subject?: string;
  message?: string | null;
  collection?: string | null;
  item?: string | null;
}

export interface DirectusShare {
  /** @primaryKey */
  id: string;
  name?: string | null;
  collection?: DirectusCollection | string;
  item?: string;
  role?: DirectusRole | string | null;
  password?: string | null;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  times_used?: number | null;
  max_uses?: number | null;
}

export interface DirectusFlow {
  /** @primaryKey */
  id: string;
  name?: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  status?: string;
  trigger?: string | null;
  accountability?: string | null;
  options?: "json" | null;
  operation?: DirectusOperation | string | null;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
  operations?: DirectusOperation[] | string[];
}

export interface DirectusOperation {
  /** @primaryKey */
  id: string;
  name?: string | null;
  key?: string;
  type?: string;
  position_x?: number;
  position_y?: number;
  options?: "json" | null;
  resolve?: DirectusOperation | string | null;
  reject?: DirectusOperation | string | null;
  flow?: DirectusFlow | string;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
}

export interface DirectusTranslation {
  /** @primaryKey */
  id: string;
  /** @required */
  language: string;
  /** @required */
  key: string;
  /** @required */
  value: string;
}

export interface DirectusVersion {
  /** @primaryKey */
  id: string;
  key?: string;
  name?: string | null;
  collection?: DirectusCollection | string;
  item?: string;
  hash?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  user_created?: DirectusUser | string | null;
  user_updated?: DirectusUser | string | null;
  delta?: "json" | null;
}

export interface DirectusExtension {
  enabled?: boolean;
  /** @primaryKey */
  id: string;
  folder?: string;
  source?: string;
  bundle?: string | null;
}

export interface Schema {
  announcements: Announcement[];
  announcements_directus_files: AnnouncementsDirectusFile[];
  buildings: Building[];
  comments: Comment[];
  comments_directus_files: CommentsDirectusFile[];
  communities: Community[];
  posts: Post[];
  posts_directus_files: PostsDirectusFile[];
  reactions: Reaction[];
  work_order_nodes: WorkOrderNode[];
  work_order_nodes_directus_files: WorkOrderNodesDirectusFile[];
  work_orders: WorkOrder[];
  work_orders_directus_files: WorkOrdersDirectusFile[];
  // Finance v2.0 tables
  billings: Billing[];
  billing_payments: BillingPayment[];
  incomes: Income[];
  expenses: Expense[];
  employees: Employee[];
  salary_records: SalaryRecord[];
  maintenance_fund_accounts: MaintenanceFundAccount[];
  maintenance_fund_payments: MaintenanceFundPayment[];
  maintenance_fund_usage: MaintenanceFundUsage[];
  directus_access: DirectusAccess[];
  directus_activity: DirectusActivity[];
  directus_collections: DirectusCollection[];
  directus_comments: DirectusComment[];
  directus_fields: DirectusField[];
  directus_files: DirectusFile[];
  directus_folders: DirectusFolder[];
  directus_migrations: DirectusMigration[];
  directus_permissions: DirectusPermission[];
  directus_policies: DirectusPolicy[];
  directus_presets: DirectusPreset[];
  directus_relations: DirectusRelation[];
  directus_revisions: DirectusRevision[];
  directus_roles: DirectusRole[];
  directus_sessions: DirectusSession[];
  directus_settings: DirectusSettings;
  directus_users: DirectusUser[];
  directus_webhooks: DirectusWebhook[];
  directus_dashboards: DirectusDashboard[];
  directus_panels: DirectusPanel[];
  directus_notifications: DirectusNotification[];
  directus_shares: DirectusShare[];
  directus_flows: DirectusFlow[];
  directus_operations: DirectusOperation[];
  directus_translations: DirectusTranslation[];
  directus_versions: DirectusVersion[];
  directus_extensions: DirectusExtension[];
}

export enum CollectionNames {
  announcements = "announcements",
  announcements_directus_files = "announcements_directus_files",
  buildings = "buildings",
  comments = "comments",
  comments_directus_files = "comments_directus_files",
  communities = "communities",
  posts = "posts",
  posts_directus_files = "posts_directus_files",
  reactions = "reactions",
  work_order_nodes = "work_order_nodes",
  work_order_nodes_directus_files = "work_order_nodes_directus_files",
  work_orders = "work_orders",
  work_orders_directus_files = "work_orders_directus_files",
  billings = "billings",
  expenses = "expenses",
  directus_access = "directus_access",
  directus_activity = "directus_activity",
  directus_collections = "directus_collections",
  directus_comments = "directus_comments",
  directus_fields = "directus_fields",
  directus_files = "directus_files",
  directus_folders = "directus_folders",
  directus_migrations = "directus_migrations",
  directus_permissions = "directus_permissions",
  directus_policies = "directus_policies",
  directus_presets = "directus_presets",
  directus_relations = "directus_relations",
  directus_revisions = "directus_revisions",
  directus_roles = "directus_roles",
  directus_sessions = "directus_sessions",
  directus_settings = "directus_settings",
  directus_users = "directus_users",
  directus_webhooks = "directus_webhooks",
  directus_dashboards = "directus_dashboards",
  directus_panels = "directus_panels",
  directus_notifications = "directus_notifications",
  directus_shares = "directus_shares",
  directus_flows = "directus_flows",
  directus_operations = "directus_operations",
  directus_translations = "directus_translations",
  directus_versions = "directus_versions",
  directus_extensions = "directus_extensions",
}
