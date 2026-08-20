/**
 * PageLayout — wraps every page with consistent header + footer.
 */
import { PortalHeader } from "@/components/PortalHeader";
import { PortalFooter } from "@/components/PortalFooter";
import type { ReactNode } from "react";

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PortalHeader />
      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>
      <PortalFooter />
    </>
  );
}
