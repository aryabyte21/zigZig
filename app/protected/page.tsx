import { redirect } from "next/navigation";

export default function ProtectedPage() {
  // Redirect to dashboard instead of showing tutorial
  redirect("/dashboard");
}
