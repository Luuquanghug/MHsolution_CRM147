// ============================
// App-level configuration
// Tập trung tất cả các hằng số, URL, cài đặt môi trường
// ============================

export const APP_CONFIG = {
  /** Tên hệ thống hiển thị trên UI */
  name: "MH Solution CRM",
  /** Tên viết tắt (sidebar collapsed) */
  shortName: "MH",
  /** Mô tả hệ thống */
  description: "Hệ thống quản lý quan hệ khách hàng",
  /** Ngôn ngữ mặc định */
  defaultLanguage: "vi",
} as const;

export const API_ENDPOINTS = {
  /** Upload file lên MinIO */
  fileUpload: "https://apiv2.mhsolution.vn/api/v1/public/minio/upload-object-path",
} as const;

export const ROUTES = {
  auth: "/auth",
  home: "/",
  organizations: "/organizations",
  organizationGroups: "/organization-groups",
  keyPersonnel: "/key-personnel",
  products: "/products",
  categories: "/categories",
  salesFunnel: "/sales-funnel",
  salesFunnelStages: "/sales-funnel/stages",
  salesTeam: "/sales-team",
  collaborators: "/collaborators",
  careSchedule: "/care-schedule",
  systemConfiguration: "/system-configuration",
  personnelFieldsConfig: "/personnel-fields-config",
  organizationFieldsConfig: "/organization-fields-config",
} as const;

export const DEFAULT_ROLE = "sales_person" as const;
