import { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  badgeVariant?: "default" | "severe" | "warning" | "success";
  description?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
