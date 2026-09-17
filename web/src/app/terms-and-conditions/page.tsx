import { redirect } from "next/navigation";

/** Legacy alias — canonical is /terms */
export default function TermsAndConditionsAliasPage() {
  redirect("/terms");
}
