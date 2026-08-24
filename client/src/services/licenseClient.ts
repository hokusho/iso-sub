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

/**
 * Returns or generates a persistent device ID for hardware locking
 */
export function getOrCreateDeviceId(): string {
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    // Generate a robust unique device fingerprint
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
  reason?: 'not_found' | 'blocked' | 'expired' | 'device_limit_exceeded';
  customerName?: string;
  expiresAt?: string | null;
  isLifetime?: boolean;
  daysRemaining?: number;
  maxDevices?: number;
  activeDevicesCount?: number;
}

/**
 * Verifies serial key with server/cloud
 */
export async function validateSerialWithServer(serial: string): Promise<LicenseValidationResponse> {
  const deviceId = getOrCreateDeviceId();
  
  try {
    const res = await fetch('/api/license/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial: serial.trim().toUpperCase(), deviceId })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: LicenseValidationResponse = await res.json();
    
    if (data.valid && data.customerName) {
      // Save locally
      saveLicenseLocally({
        serial: serial.trim().toUpperCase(),
        customerName: data.customerName,
        expiresAt: data.expiresAt ?? null,
        isLifetime: data.isLifetime ?? false,
        daysRemaining: data.daysRemaining ?? 9999,
        lastValidatedAt: new Date().toISOString()
      });
    }

    return data;
  } catch (err: any) {
    console.error('Falha ao validar serial online:', err);
    // If offline, check if we have a locally cached valid license that hasn't expired yet
    const cached = getSavedLicense();
    if (cached && cached.serial === serial.trim().toUpperCase()) {
      if (cached.isLifetime) {
        return {
          valid: true,
          message: 'Licença ativa (Modo Offline).',
          customerName: cached.customerName,
          isLifetime: true,
          expiresAt: null
        };
      }
      if (cached.expiresAt) {
        const diff = new Date(cached.expiresAt).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days > 0) {
          return {
            valid: true,
            message: `Licença ativa (Modo Offline - ${days}d restantes).`,
            customerName: cached.customerName,
            expiresAt: cached.expiresAt,
            daysRemaining: days
          };
        }
      }
    }

    return {
      valid: false,
      message: 'Não foi possível conectar ao servidor de licenças. Verifique sua conexão com a internet.'
    };
  }
}
