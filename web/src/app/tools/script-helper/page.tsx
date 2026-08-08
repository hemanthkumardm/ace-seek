import { headers } from "next/headers";
import { productHostSlug } from "@/lib/site";

export const metadata = {
  title: "Script Helper",
};

export default async function ScriptHelperPage() {
  const host = (await headers()).get("host");
  const slug = productHostSlug(host);
  const back = slug ? "https://ace-seek.com/dashboard" : "/dashboard";

  return (
    <div className="m-shell py-16 max-w-lg">
      <p className="m-label mb-3">scripts.ace-seek.com · coming soon</p>
      <h1 className="text-2xl font-semibold tracking-tight">Script Helper</h1>
      <p className="mt-3 text-sm m-muted leading-relaxed">
        Snippet generation for Tcl, Python, and Makefile workflows used in EDA /
        VLSI flows. Placeholder until the first generators ship.
      </p>
      <a href={back} className="m-btn m-btn-ghost mt-8 text-xs">
        ← Dashboard
      </a>
    </div>
  );
}
