import { NavLink, Outlet } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";

export function AdminLayout() {
  const adminNavs = [
    { label: "Dashboard", path: "/admin" },
    { label: "Upload Data", path: "/admin/upload" },
    { label: "Agent Activity", path: "/admin/agent-activity" },
  ];

  return (
    <PageLayout>
      <div className="bg-institutional-dark text-white border-b border-saffron py-3">
        <div className="portal-container flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-saffron animate-pulse" />
            <span className="font-bold text-sm tracking-wider uppercase text-saffron">CivicLens Admin Suite</span>
            <span className="text-xs text-white/60">| Government Control Center</span>
          </div>

          <div className="flex gap-2">
            {adminNavs.map(nav => (
              <NavLink
                key={nav.path}
                to={nav.path}
                end={nav.path === "/admin"}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-bold rounded-xs transition-colors ${
                    isActive ? "bg-saffron text-institutional-dark" : "bg-white/10 hover:bg-white/20 text-white"
                  }`
                }
              >
                {nav.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="py-6">
        <Outlet />
      </div>
    </PageLayout>
  );
}
