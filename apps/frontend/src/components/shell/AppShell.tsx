import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { StatusBar } from "./StatusBar";
import { GlobalReadNotifier } from "./GlobalReadNotifier";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div id="app-shell-root" className={styles.shell}>
      <TopNav />
      <StatusBar />
      <main id="app-main-content" className={styles.main}>
        {children}
      </main>
      <GlobalReadNotifier />
    </div>
  );
}
