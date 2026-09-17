import { redirect } from "next/navigation";

/** Legacy alias — canonical is /privacy */
export default function PrivacyPolicyAliasPage() {
  redirect("/privacy");
}
