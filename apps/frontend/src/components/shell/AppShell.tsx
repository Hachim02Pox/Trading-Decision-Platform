import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { PageFooter } from "./PageFooter";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div id="app-shell-root" className={styles.shell}>
      <TopNav />
      <main id="app-main-content" className={styles.main}>
        {children}
      </main>
      <PageFooter />
    </div>
  );
}
