import { useEffect, useState } from 'react';
import { ConsoleShell, adminNav } from '../components/ConsoleShell';
import { Panel } from '../components/ui';
import { api } from '../lib/api';

export function AdminAuditPage() {
  const [auditLog, setAuditLog] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLog().then(setAuditLog);
    const t = setInterval(() => api.getAuditLog().then(setAuditLog), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <ConsoleShell nav={adminNav} title="Audit log">
      <Panel>
        {auditLog.length === 0 ? (
          <p className="p-8 text-center text-sm text-muteOnLight">
            No actions recorded yet — actions like calling a customer, completing service, or booking an appointment will appear here.
          </p>
        ) : (
          <div className="divide-y divide-ink/10">
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p><span className="font-medium">{entry.actor}</span> <span className="text-muteOnLight">{entry.action}</span></p>
                  <p className="text-xs text-muteOnLight">{entry.entity}{entry.metadata ? ` · ${entry.metadata}` : ''}</p>
                </div>
                <span className="font-mono text-xs text-muteOnLight">{new Date(entry.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </ConsoleShell>
  );
}
