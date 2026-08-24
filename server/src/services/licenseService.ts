import fs from 'fs';
import path from 'path';

export interface LicenseRecord {
  id: string;
  serial: string;
  customerName: string;
  phone?: string;
  email?: string;
  createdAt: string;
  expiresAt: string | null;
  durationDays?: string | number;
  maxDevices: number;
  activeDevices: string[];
  status: 'active' | 'blocked';
  price?: number;
  notes?: string;
}

const LICENSES_FILE = path.join(__dirname, '../../storage/licenses.json');

// Ensure directory exists
function ensureStorage() {
  const dir = path.dirname(LICENSES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadLicenses(): LicenseRecord[] {
  ensureStorage();
  if (!fs.existsSync(LICENSES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(LICENSES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLicenses(licenses: LicenseRecord[]): void {
  ensureStorage();
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(licenses, null, 2), 'utf-8');
}

export interface ValidationResult {
  valid: boolean;
  reason?: 'not_found' | 'blocked' | 'expired' | 'device_limit_exceeded';
  message: string;
  customerName?: string;
  expiresAt?: string | null;
  isLifetime?: boolean;
  daysRemaining?: number;
  maxDevices?: number;
  activeDevicesCount?: number;
}

/**
 * Validates a serial key and binds the client deviceId
 */
export function validateLicense(rawSerial: string, deviceId: string): ValidationResult {
  if (!rawSerial || typeof rawSerial !== 'string') {
    return { valid: false, reason: 'not_found', message: 'Serial inválido ou não fornecido.' };
  }

  const cleanSerial = rawSerial.trim().toUpperCase();
  const licenses = loadLicenses();
  const lic = licenses.find(l => l.serial.trim().toUpperCase() === cleanSerial);

  if (!lic) {
    return { valid: false, reason: 'not_found', message: 'Chave de serial não encontrada no sistema.' };
  }

  if (lic.status === 'blocked') {
    return { valid: false, reason: 'blocked', message: 'Esta licença foi bloqueada pelo administrador.' };
  }

  const isLifetime = !lic.expiresAt;
  let daysRemaining = 9999;

  if (lic.expiresAt) {
    const now = new Date();
    const exp = new Date(lic.expiresAt);
    const diffMs = exp.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return {
        valid: false,
        reason: 'expired',
        message: 'Sua licença expirou. Entre em contato para renovação.',
        customerName: lic.customerName,
        expiresAt: lic.expiresAt,
        daysRemaining: 0
      };
    }
  }

  // Device Binding Check
  if (!lic.activeDevices) {
    lic.activeDevices = [];
  }

  const cleanDeviceId = (deviceId || 'browser_default').trim();
  const isAlreadyRegistered = lic.activeDevices.includes(cleanDeviceId);

  if (!isAlreadyRegistered) {
    if (lic.activeDevices.length >= lic.maxDevices) {
      return {
        valid: false,
        reason: 'device_limit_exceeded',
        message: `Limite de computadores atingido (${lic.maxDevices} PC(s)). Solicite o reset ao administrador.`,
        customerName: lic.customerName,
        maxDevices: lic.maxDevices,
        activeDevicesCount: lic.activeDevices.length
      };
    }

    // Register this new device
    lic.activeDevices.push(cleanDeviceId);
    saveLicenses(licenses);
  }

  return {
    valid: true,
    message: 'Licença válida e ativa.',
    customerName: lic.customerName,
    expiresAt: lic.expiresAt,
    isLifetime,
    daysRemaining,
    maxDevices: lic.maxDevices,
    activeDevicesCount: lic.activeDevices.length
  };
}
