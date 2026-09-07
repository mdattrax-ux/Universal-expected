/**
 * MASTER DEVELOPER SPECIFICATION
 * Section 19: Security & Reputation Audit Engine
 * Evaluates permissions, exported attack surface, debuggable flags,
 * embedded API keys, trackers, and cleartext traffic.
 */

import { ExtractedFile, SecurityAudit, SecurityVulnerability } from '../types/analyzer';

const DANGEROUS_PERMISSIONS = [
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.READ_CONTACTS',
  'android.permission.WRITE_CONTACTS',
  'android.permission.READ_SMS',
  'android.permission.SEND_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.READ_CALL_LOG',
  'android.permission.WRITE_CALL_LOG',
  'android.permission.READ_PHONE_STATE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.WRITE_SETTINGS',
  'android.permission.REQUEST_INSTALL_PACKAGES',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.USE_BIOMETRIC',
];

const KNOWN_TRACKERS = [
  { name: 'Google Firebase Analytics', pattern: /firebase[._]analytics|google-analytics/i },
  { name: 'Facebook SDK / Meta Analytics', pattern: /com\.facebook\.appevents|com\.facebook\.sdk/i },
  { name: 'AppsFlyer', pattern: /appsflyer/i },
  { name: 'Adjust Analytics', pattern: /com\.adjust\.sdk/i },
  { name: 'Flurry Analytics', pattern: /com\.flurry/i },
  { name: 'Crashlytics', pattern: /crashlytics/i },
  { name: 'Google AdMob / Ads', pattern: /google\.android\.gms\.ads/i },
  { name: 'Unity Ads', pattern: /com\.unity3d\.ads/i },
  { name: 'AppLovin SDK', pattern: /applovin/i },
  { name: 'OneSignal Push Notifications', pattern: /onesignal/i },
];

export function performSecurityAudit(
  files: ExtractedFile[],
  manifestText?: string
): SecurityAudit {
  const vulnerabilities: SecurityVulnerability[] = [];
  const sensitivePermissions: string[] = [];
  const hardcodedSecrets: SecurityAudit['hardcodedSecrets'] = [];
  const detectedTrackers: string[] = [];

  let debuggable = false;
  let allowBackup = true;
  let usesCleartextTraffic = false;

  // 1. Audit AndroidManifest.xml
  if (manifestText) {
    if (/android:debuggable\s*=\s*"true"/i.test(manifestText)) {
      debuggable = true;
      vulnerabilities.push({
        id: 'VULN-DEBUG-01',
        title: 'Application is Debuggable in Production',
        severity: 'high',
        category: 'Manifest Configuration',
        description: 'android:debuggable is set to "true". Attackers can attach jdb/debugger to inspect memory, dump tokens, and bypass security logic.',
        recommendation: 'Ensure android:debuggable="false" in release build variants in build.gradle.kts.',
      });
    }

    if (/android:allowBackup\s*=\s*"true"/i.test(manifestText)) {
      allowBackup = true;
      vulnerabilities.push({
        id: 'VULN-BACKUP-02',
        title: 'Application Backup Allowed (allowBackup=true)',
        severity: 'medium',
        category: 'Data Protection',
        description: 'ADB backup is permitted. Attackers with physical device access can extract private app databases and shared preferences using "adb backup".',
        recommendation: 'Explicitly set android:allowBackup="false" or configure android:fullBackupContent to exclude private keys and tokens.',
      });
    }

    if (/android:usesCleartextTraffic\s*=\s*"true"/i.test(manifestText)) {
      usesCleartextTraffic = true;
      vulnerabilities.push({
        id: 'VULN-CLEARTEXT-03',
        title: 'Cleartext HTTP Traffic Permitted',
        severity: 'high',
        category: 'Network Security',
        description: 'android:usesCleartextTraffic is enabled. Unencrypted HTTP transmissions are vulnerable to Man-In-The-Middle (MITM) eavesdropping.',
        recommendation: 'Enforce HTTPS network security configuration (cleartextTrafficPermitted="false").',
      });
    }

    // Check dangerous permissions
    for (const perm of DANGEROUS_PERMISSIONS) {
      if (manifestText.includes(perm)) {
        sensitivePermissions.push(perm);
      }
    }

    if (sensitivePermissions.length >= 4) {
      vulnerabilities.push({
        id: 'VULN-PERMS-04',
        title: 'High Volume of Privileged Dangerous Permissions',
        severity: 'medium',
        category: 'Permission Exposure',
        description: `Application requests ${sensitivePermissions.length} sensitive dangerous permissions including hardware sensors, location, or private contacts.`,
        recommendation: 'Review least-privilege principle and request permissions dynamically with justified rationales.',
      });
    }
  }

  // 2. Scan extracted strings across all files for Hardcoded Secrets, API Keys & Trackers
  const apiKeyRegexes = [
    { type: 'Google API Key', regex: /AIzaSy[0-9A-Za-z_-]{33}/g },
    { type: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g },
    { type: 'Stripe API Key', regex: /sk_live_[0-9a-zA-Z]{24}/g },
    { type: 'Generic Private Token', regex: /(?:api_key|access_token|secret_key)\s*[:=]\s*["']([A-Za-z0-9_-]{20,})["']/gi },
    { type: 'Hardcoded Internal IP Address', regex: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g },
  ];

  for (const file of files) {
    if (!file.decodedContent) continue;
    const content = file.decodedContent;

    // Check Trackers
    for (const tracker of KNOWN_TRACKERS) {
      if (tracker.pattern.test(content) && !detectedTrackers.includes(tracker.name)) {
        detectedTrackers.push(tracker.name);
      }
    }

    // Check API Keys
    for (const keyRule of apiKeyRegexes) {
      const matches = content.match(keyRule.regex);
      if (matches) {
        for (const match of matches.slice(0, 3)) {
          if (!hardcodedSecrets.some((s) => s.matchedString === match)) {
            hardcodedSecrets.push({
              type: keyRule.type,
              file: file.name,
              matchedString: match.length > 40 ? match.substring(0, 35) + '...' : match,
            });
          }
        }
      }
    }
  }

  if (hardcodedSecrets.length > 0) {
    vulnerabilities.push({
      id: 'VULN-SECRET-05',
      title: 'Hardcoded Secrets or Private Keys Found in Source',
      severity: 'high',
      category: 'Credential Leakage',
      description: `Discovered ${hardcodedSecrets.length} potential hardcoded API keys or private tokens inside code files.`,
      recommendation: 'Move credentials to secure server-side infrastructure or Android Keystore.',
    });
  }

  // Calculate Risk Score (0 - 100)
  let riskScore = 15; // baseline
  if (debuggable) riskScore += 30;
  if (usesCleartextTraffic) riskScore += 25;
  if (allowBackup) riskScore += 10;
  riskScore += Math.min(sensitivePermissions.length * 5, 25);
  riskScore += Math.min(hardcodedSecrets.length * 10, 20);
  riskScore = Math.min(100, Math.max(0, riskScore));

  return {
    riskScore,
    debuggable,
    allowBackup,
    usesCleartextTraffic,
    sensitivePermissions,
    vulnerabilities,
    hardcodedSecrets,
    detectedTrackers,
  };
}
