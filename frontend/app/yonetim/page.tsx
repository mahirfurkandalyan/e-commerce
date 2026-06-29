import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Yönetim Paneli | Micro Commerce",
  description: "Ürün, stok ve sipariş yönetimi için premium görünümlü mağaza paneli.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
