export interface ClientLicenseInfo {
  serial: string;
  customerName: string;
  expiresAt: string | null;
  isLifetime: boolean;
  daysRemaining: number;
  lastValidatedAt: string;
}

const STORAGE_KEY = 'isosub_license_data';
const DEVICE_ID_KEY = 'isosub_device_hwid';

// Official Supabase Cloud configuration for ISO SUB
const SUPABASE_URL = "https://trrewoowgbhyfceumrlt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycmV3b293Z2JoeWZjZXVtcmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODEyODAsImV4cCI6MjEwMzE1NzI4MH0.f_qkTF1PHgvmQMr12XgectaWCD1PquY6GSZItLM8IlE";

/**
 * Returns or generates a persistent device ID for hardware locking
 */
export function getOrCreateDeviceId(): string {
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    const rnd = Math.random().toString(36).substring(2, 10).toUpperCase();
    devId = `DEV-${Date.now().toString(36).toUpperCase()}-${rnd}`;
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
}

export function getSavedLicense(): ClientLicenseInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLicenseLocally(info: ClientLicenseInfo): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

export function clearSavedLicense(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface LicenseValidationResponse {
  valid: boolean;
  message: string;
  reason?: 'not_found' | 'name_mismatch' | 'blocked' | 'expired' | 'device_limit_exceeded';
  customerName?: string;
  expiresAt?: string | null;
  isLifetime?: boolean;
  daysRemaining?: number;
  maxDevices?: number;
  activeDevicesCount?: number;
}

/**
 * Verifies User Name and Serial Key with Supabase in real-time
 */
export async function validateLicenseOnline(userName: string, serialKey: string): Promise<LicenseValidationResponse> {
  const cleanSerial = (serialKey || '').trim().toUpperCase();
  const cleanName = (userName || '').trim().toLowerCase();
  const deviceId = getOrCreateDeviceId();

  if (!cleanSerial) {
    return { valid: false, reason: 'not_found', message: 'Por favor, informe a chave de serial.' };
  }
  if (!cleanName) {
    return { valid: false, reason: 'name_mismatch', message: 'Por favor, informe o seu nome de usuário cadastrado.' };
  }

  try {
    // Query Supabase directly
    const url = `${SUPABASE_URL}/rest/v1/licenses?serial=eq.${encodeURIComponent(cleanSerial)}&select=*`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      throw new Error(`Erro ao conectar ao Supabase: HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      return { valid: false, reason: 'not_found', message: 'Chave de serial não encontrada no sistema.' };
    }

    const lic = data[0];

    // 1. Check Name match (case-insensitive)
    const registeredName = (lic.customer_name || '').trim().toLowerCase();
    if (registeredName !== cleanName && !registeredName.includes(cleanName) && !cleanName.includes(registeredName)) {
      return {
        valid: false,
        reason: 'name_mismatch',
        message: `O nome "${userName}" não corresponde ao titular cadastrado para este serial.`
      };
    }

    // 2. Check if Blocked
    if (lic.status === 'blocked') {
      return {
        valid: false,
        reason: 'blocked',
        message: 'Esta licença foi bloqueada pelo administrador.'
      };
    }

    // 3. Check Expiration Date
    const isLifetime = !lic.expires_at || lic.duration_days === 'vitalicio';
    let daysRemaining = 9999;

    if (!isLifetime && lic.expires_at) {
      const now = new Date();
      const exp = new Date(lic.expires_at);
      const diffMs = exp.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDaysRemaining(lic.expires_at) <= 0) {
        return {
          valid: false,
          reason: 'expired',
          message: 'Sua licença expirou. Entre em contato para renovação.',
          customerName: lic.customer_name,
          expiresAt: lic.expires_at,
          daysRemaining: 0
        };
      }
    }

    // 4. Device Binding Check (HWID)
    let devices: string[] = Array.isArray(lic.active_devices) ? [...lic.active_devices] : [];
    const maxDevices = lic.max_devices || 1;
    const isAlreadyBound = devices.includes(deviceId);

    if (!isAlreadyBound) {
      if (devices.length >= maxDevices) {
        return {
          valid: false,
          reason: 'device_limit_exceeded',
          message: `Limite de computadores atingido (${maxDevices} PC). Solicite o reset no painel administrativo.`,
          customerName: lic.customer_name,
          maxDevices,
          activeDevicesCount: devices.length
        };
      }

      // Bind new device
      devices.push(deviceId);
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/licenses?id=eq.${encodeURIComponent(lic.id)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ active_devices: devices })
        });
      } catch (patchErr) {
        console.warn('Could not update active_devices on Supabase:', patchErr);
      }
    }

    // Save locally
    const licenseInfo: ClientLicenseInfo = {
      serial: cleanSerial,
      customerName: lic.customer_name,
      expiresAt: lic.expires_at ?? null,
      isLifetime,
      daysRemaining,
      lastValidatedAt: new Date().toISOString()
    };
    saveLicenseLocally(licenseInfo);

    return {
      valid: true,
      message: 'Licença ativada com sucesso.',
      customerName: lic.customer_name,
      expiresAt: lic.expires_at ?? null,
      isLifetime,
      daysRemaining,
      maxDevices,
      activeDevicesCount: devices.length
    };

  } catch (err: any) {
    console.error('Falha ao validar licença online:', err);
    // Offline fallback check
    const cached = getSavedLicense();
    if (cached && cached.serial === cleanSerial && cached.customerName.toLowerCase() === cleanName) {
      return {
        valid: true,
        message: 'Licença ativa (Modo Offline).',
        customerName: cached.customerName,
        isLifetime: cached.isLifetime,
        expiresAt: cached.expiresAt,
        daysRemaining: cached.daysRemaining
      };
    }

    return {
      valid: false,
      message: 'Não foi possível conectar ao servidor de licenças. Verifique sua conexão com a internet.'
    };
  }
}

function diffDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Removes device ID from Supabase and clears local storage
 */
export async function deactivateLicenseOnline(serialKey: string): Promise<void> {
  const cleanSerial = (serialKey || '').trim().toUpperCase();
  const deviceId = getOrCreateDeviceId();
  clearSavedLicense();

  if (!cleanSerial) return;

  try {
    const url = `${SUPABASE_URL}/rest/v1/licenses?serial=eq.${encodeURIComponent(cleanSerial)}&select=*`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const lic = data[0];
        const devices = (lic.active_devices || []).filter((d: string) => d !== deviceId);
        await fetch(`${SUPABASE_URL}/rest/v1/licenses?id=eq.${encodeURIComponent(lic.id)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ active_devices: devices })
        });
      }
    }
  } catch (err) {
    console.warn('Deactivate error on Supabase:', err);
  }
}
