import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect(process.env.NEXT_PUBLIC_BACKEND_ADMIN_URL ?? "http://localhost:8000/admin");
}
