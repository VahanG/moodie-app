import type { ReactNode } from "react";
import styles from "./AdminPortal.module.css";

export function AccessPage({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className={styles.accessShell}>
      <section className={styles.accessIntro}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>M</span>
          <span>
            <strong>Moodie</strong>
            <small>Admin workspace</small>
          </span>
        </div>
        <div>
          <p className={styles.eyebrow}>Private by design</p>
          <h2>Thoughtful products deserve thoughtful operations.</h2>
          <p>
            Curate the digital catalog, prepare content drops, and keep the
            supporter experience current from one focused workspace.
          </p>
        </div>
        <small>Web-only · Independently deployed · Database-authorized</small>
      </section>
      <section className={styles.accessPanel}>
        <div className={styles.accessCard}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}
