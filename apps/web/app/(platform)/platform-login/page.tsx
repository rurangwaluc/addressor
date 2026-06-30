import { redirect } from "next/navigation";

export default function PlatformLoginPage() {
  redirect("/login?intent=platform");
}
