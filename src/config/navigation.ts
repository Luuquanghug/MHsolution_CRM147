import {
  Building2,
  Users,
  Package,
  Calendar,
  UserCheck,
  TrendingUp,
  Tags,
  FolderTree,
  Settings,
} from "lucide-react";
import { ROUTES } from "./app";

export interface MenuItem {
  title: string;
  url: string;
  icon: typeof TrendingUp;
  subItems?: { title: string; url: string }[];
}

export const menuItems: MenuItem[] = [
  { title: "Tổng quan", url: ROUTES.home, icon: TrendingUp },
  { title: "Lịch Làm việc", url: ROUTES.careSchedule, icon: Calendar },
  {
    title: "Phễu Bán hàng",
    url: ROUTES.salesFunnel,
    icon: TrendingUp,
    subItems: [
      { title: "Danh sách Cơ hội", url: ROUTES.salesFunnel },
      { title: "Cấu hình phễu", url: ROUTES.salesFunnelStages },
    ],
  },
  {
    title: "Khách hàng & Đối tác",
    url: ROUTES.organizations,
    icon: Building2,
    subItems: [
      { title: "Danh sách Khách hàng", url: ROUTES.organizations },
      { title: "Nhóm Khách hàng", url: ROUTES.organizationGroups },
      { title: "Nhân sự chủ chốt", url: ROUTES.keyPersonnel },
    ],
  },
  {
    title: "Sản phẩm & Dịch vụ",
    url: ROUTES.products,
    icon: Package,
    subItems: [
      { title: "Sản phẩm & Dịch vụ", url: ROUTES.products },
      { title: "Danh mục Sản phẩm", url: ROUTES.categories },
    ],
  },
  {
    title: "Nhân viên Kinh doanh",
    url: ROUTES.salesTeam,
    icon: UserCheck,
    subItems: [
      { title: "Nhân viên Kinh doanh", url: ROUTES.salesTeam },
      { title: "Cộng tác viên", url: ROUTES.collaborators },
    ],
  },
];

export const adminMenuItems: MenuItem[] = [
  {
    title: "Cấu hình hệ thống",
    url: ROUTES.systemConfiguration,
    icon: Settings,
    subItems: [
      { title: "Cấu hình chung", url: ROUTES.systemConfiguration },
      { title: "Cấu hình Nhân sự chủ chốt", url: ROUTES.personnelFieldsConfig },
      { title: "Cấu hình Tổ chức", url: ROUTES.organizationFieldsConfig },
    ],
  },
];
