import { FormEvent, useEffect, useState } from 'react';
import {
  loadAdminNotificationSettings,
  MAX_RANDOM_REMINDERS_PER_DAY,
  MIN_RANDOM_REMINDERS_PER_DAY,
  parseRandomRemindersPerDay,
  saveAdminNotificationSettings,
} from '../lib/notificationSettings';
import styles from './NotificationSettingsManager.module.css';

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The notification settings operation failed.';
}

export function NotificationSettingsManager() {
  const [countInput, setCountInput] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    loadAdminNotificationSettings()
      .then(settings => {
        if (!active) return;
        setCountInput(settings.randomRemindersPerDay.toString());
        setUpdatedAt(settings.updatedAt);
      })
      .catch(loadError => {
        if (active) setError(messageFrom(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    try {
      const count = parseRandomRemindersPerDay(Number(countInput));
      setSaving(true);
      const settings = await saveAdminNotificationSettings(count);
      setCountInput(settings.randomRemindersPerDay.toString());
      setUpdatedAt(settings.updatedAt);
      setSaved(true);
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p>Delivery controls</p>
          <h1>Notifications</h1>
          <p>
            Set the number of randomized reminders supporters receive each day.
          </p>
        </div>
      </header>

      <div className={styles.panel}>
        {loading ? (
          <p className={styles.loading}>Loading notification settings…</p>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <div>
              <p className={styles.eyebrow}>Random reminders</p>
              <h2>Daily notification count</h2>
              <p className={styles.description}>
                The app randomizes this many notifications inside each
                supporter’s selected time range, keeping at least 60 minutes
                between deliveries.
              </p>
            </div>

            <label>
              Notifications per day
              <input
                aria-describedby="notification-count-help"
                disabled={saving}
                inputMode="numeric"
                max={MAX_RANDOM_REMINDERS_PER_DAY}
                min={MIN_RANDOM_REMINDERS_PER_DAY}
                onChange={event => {
                  setCountInput(event.target.value.replace(/[^0-9]/g, ''));
                  setSaved(false);
                }}
                required
                type="number"
                value={countInput}
              />
            </label>
            <small id="notification-count-help">
              Choose {MIN_RANDOM_REMINDERS_PER_DAY}–
              {MAX_RANDOM_REMINDERS_PER_DAY}. Narrow user ranges are rejected
              when they cannot preserve the one-hour minimum spacing.
            </small>

            {error && <p className={styles.error}>{error}</p>}
            {saved && (
              <p className={styles.success} role="status">
                Notification count saved. Apps pick it up the next time they
                launch or return to the foreground.
              </p>
            )}

            <div className={styles.actions}>
              <button disabled={saving} type="submit">
                {saving ? 'Saving…' : 'Save notification count'}
              </button>
              {updatedAt && (
                <small>
                  Last updated {new Date(updatedAt).toLocaleString()}
                </small>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
