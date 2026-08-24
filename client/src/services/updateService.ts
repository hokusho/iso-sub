/**
 * ISO SUB — Hot-Update / OTA Service (Atualizações sem reinstalar)
 */

export const CURRENT_APP_VERSION = '1.1.5';

const SUPABASE_URL = 'https://trrewoowgbhyfceumrlt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycmV3b293Z2JoeWZjZXVtcmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODEyODAsImV4cCI6MjEwMzE1NzI4MH0.f_qkTF1PHgvmQMr12XgectaWCD1PquY6GSZItLM8IlE';

export interface AppUpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseNotes?: string;
  bundleUrl?: string;
  mandatory?: boolean;
}

/**
 * Compara duas versões no formato semver (ex: "1.1.6" > "1.1.5")
 */
function isVersionHigher(remote: string, current: string): boolean {
  try {
    const rParts = remote.replace(/[^0-9.]/g, '').split('.').map(Number);
    const cParts = current.replace(/[^0-9.]/g, '').split('.').map(Number);

    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
      const r = rParts[i] || 0;
      const c = cParts[i] || 0;
      if (r > c) return true;
      if (r < c) return false;
    }
    return false;
  } catch {
    return remote !== current;
  }
}

/**
 * Verifica se há uma atualização disponível no Supabase
 */
export async function checkForAppUpdates(): Promise<AppUpdateInfo | null> {
  try {
    // 1. Tenta buscar da tabela app_updates no Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_updates?select=*&order=created_at.desc&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const update = data[0];
        const remoteVersion = update.version || update.latest_version;
        if (remoteVersion && isVersionHigher(remoteVersion, CURRENT_APP_VERSION)) {
          return {
            hasUpdate: true,
            latestVersion: remoteVersion,
            currentVersion: CURRENT_APP_VERSION,
            releaseNotes: update.notes || update.release_notes || 'Novas melhorias e correções de desempenho.',
            bundleUrl: update.bundle_url || update.download_url,
            mandatory: Boolean(update.mandatory)
          };
        }
      }
    }
    return {
      hasUpdate: false,
      latestVersion: CURRENT_APP_VERSION,
      currentVersion: CURRENT_APP_VERSION
    };
  } catch (err) {
    console.warn('Erro ao checar atualizações:', err);
    return null;
  }
}

/**
 * Aplica a atualização com 1 clique no backend e recarrega o app
 */
export async function applyAppUpdate(bundleUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/updates/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundleUrl })
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha ao aplicar atualização.' };
  }
}
