import { useState } from 'react';
import { type AdminIdentity } from '../lib/auth';
import { ContentManager } from './ContentManager';
import { GalleryManager } from './GalleryManager';
import { NotificationSettingsManager } from './NotificationSettingsManager';
import styles from './AdminPortal.module.css';

const navigation = [
  { id: 'overview', label: 'Overview', enabled: true },
  { id: 'content', label: 'Content', enabled: true },
  { id: 'gallery', label: 'Gallery', enabled: true },
  { id: 'notifications', label: 'Notifications', enabled: true },
  { id: 'catalog', label: 'Catalog', enabled: false },
  { id: 'commerce', label: 'Commerce', enabled: false },
  { id: 'insights', label: 'Insights', enabled: false },
];

export function AdminDashboard({
  identity,
  onSignOut,
}: {
  identity: AdminIdentity;
  onSignOut: () => void;
}) {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>M</span>
          <span>
            <strong>Moodie</strong>
            <small>Admin workspace</small>
          </span>
        </div>

        <nav aria-label="Admin sections" className={styles.navigation}>
          {navigation.map(item => (
            <button
              className={
                item.enabled && activeSection === item.id
                  ? styles.navActive
                  : item.enabled
                  ? styles.navEnabled
                  : styles.navDisabled
              }
              disabled={!item.enabled}
              onClick={() => setActiveSection(item.id)}
              key={item.label}
              type="button"
            >
              <span>{item.label}</span>
              {!item.enabled && <small>Soon</small>}
            </button>
          ))}
        </nav>

        <div className={styles.accountCard}>
          <span className={styles.avatar}>
            {identity.email.charAt(0).toUpperCase()}
          </span>
          <span className={styles.accountText}>
            <strong>Administrator</strong>
            <small>{identity.email}</small>
          </span>
          <button onClick={onSignOut} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {activeSection === 'gallery' ? (
          <GalleryManager />
        ) : activeSection === 'content' ? (
          <ContentManager />
        ) : activeSection === 'notifications' ? (
          <NotificationSettingsManager />
        ) : (
          <>
            <header className={styles.pageHeader}>
              <div>
                <p className={styles.eyebrow}>Operations</p>
                <h1>Workspace overview</h1>
                <p>One secure place to manage Moodie’s remote experience.</p>
              </div>
              <span className={styles.accessBadge}>
                <i aria-hidden="true" />
                Admin access verified
              </span>
            </header>

            <section aria-labelledby="readiness-title" className={styles.hero}>
              <div>
                <p className={styles.eyebrow}>Foundation ready</p>
                <h2 id="readiness-title">The admin boundary is in place.</h2>
                <p>
                  Authentication and role verification are connected. Product
                  operations will unlock as their protected APIs are
                  implemented.
                </p>
              </div>
              <div aria-hidden="true" className={styles.heroMonogram}>
                M
              </div>
            </section>

            <section
              aria-label="Admin capability status"
              className={styles.grid}
            >
              <StatusCard
                index="01"
                status="Ready"
                subtitle="Supabase session active"
                title="Identity"
              />
              <StatusCard
                index="02"
                status="Ready"
                subtitle="Database membership verified"
                title="Access control"
              />
              <StatusCard
                index="03"
                status="Ready"
                subtitle="Protected database CRUD connected"
                title="Affirmation content"
              />
            </section>

            <section className={styles.activity}>
              <div>
                <p className={styles.eyebrow}>Activity</p>
                <h2>No admin changes yet</h2>
                <p>
                  Publishing history and audit events will appear here when the
                  first protected content workflow is connected.
                </p>
              </div>
              <span className={styles.emptyDate}>Today</span>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatusCard({
  index,
  status,
  subtitle,
  title,
}: {
  index: string;
  status: 'Ready' | 'Planned';
  subtitle: string;
  title: string;
}) {
  return (
    <article className={styles.statusCard}>
      <span className={styles.cardIndex}>{index}</span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <span className={status === 'Ready' ? styles.ready : styles.pending}>
        {status}
      </span>
    </article>
  );
}
