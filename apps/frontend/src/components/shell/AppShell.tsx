import type { ReactNode } from "react";
import { NavRail } from "./NavRail";
import { StatusBar } from "./StatusBar";
import { GlobalReadNotifier } from "./GlobalReadNotifier";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div id="app-shell-root" className={styles.shell}>
      <NavRail />
      <div className={styles.column}>
        <StatusBar />
        <main id="app-main-content" className={styles.main}>
          {children}
        </main>
      </div>
      <GlobalReadNotifier />
    </div>
  );
}
