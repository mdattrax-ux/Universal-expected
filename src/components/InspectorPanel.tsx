import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Key,
  Layers,
  Cpu,
  Binary,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { ExtractedFile, FileAnalysisReport, SecurityAudit } from '../types/analyzer';
import { formatBytes } from '../utils/fileDetector';
import { performSecurityAudit } from '../utils/securityScanner';

interface InspectorPanelProps {
  report: FileAnalysisReport;
  activeFile: ExtractedFile;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ report, activeFile }) => {
  const [activeTab, setActiveTab] = useState<'security' | 'meta' | 'manifest'>('security');

  const securityAudit = React.useMemo(() => {
    const manifestFile = report.extractedFiles.find((f) => f.path.endsWith('AndroidManifest.xml'));
    return performSecurityAudit(report.extractedFiles, manifestFile?.decodedContent);
  }, [report]);

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden h-full select-none text-xs">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 bg-slate-900/80">
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Security Audit
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'meta'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          File Details
        </button>
        {report.apkMetadata && (
          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'manifest'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            APK Info
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {/* Risk Score Widget */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 font-medium">Attack Surface Risk</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    securityAudit.riskScore > 50
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : securityAudit.riskScore > 25
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  Score: {securityAudit.riskScore} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    securityAudit.riskScore > 50
                      ? 'bg-rose-500'
                      : securityAudit.riskScore > 25
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${securityAudit.riskScore}%` }}
                />
              </div>
            </div>

            {/* Quick Flags */}
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Debuggable</span>
                <span className={securityAudit.debuggable ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {securityAudit.debuggable ? 'YES (High)' : 'No'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Cleartext</span>
                <span className={securityAudit.usesCleartextTraffic ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {securityAudit.usesCleartextTraffic ? 'Allowed' : 'Disabled'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Backup</span>
                <span className={securityAudit.allowBackup ? 'text-amber-400' : 'text-emerald-400'}>
                  {securityAudit.allowBackup ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Trackers</span>
                <span className="text-blue-400">{securityAudit.detectedTrackers.length} Found</span>
              </div>
            </div>

            {/* Vulnerabilities List */}
            {securityAudit.vulnerabilities.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
                  Detected Vulnerabilities ({securityAudit.vulnerabilities.length})
                </div>
                {securityAudit.vulnerabilities.map((v) => (
                  <div
                    key={v.id}
                    className={`p-2.5 rounded border ${
                      v.severity === 'high'
                        ? 'bg-rose-500/5 border-rose-500/20'
                        : 'bg-amber-500/5 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
                      <AlertTriangle
                        className={`w-3.5 h-3.5 ${
                          v.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      />
                      <span>{v.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed mb-1">{v.description}</p>
                    <div className="text-[10px] text-blue-400 font-mono">
                      Fix: {v.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sensitive Permissions */}
            {securityAudit.sensitivePermissions.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
                  Dangerous Permissions ({securityAudit.sensitivePermissions.length})
                </div>
                <div className="space-y-1">
                  {securityAudit.sensitivePermissions.map((perm) => (
                    <div
                      key={perm}
                      className="p-1.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-amber-300 truncate"
                      title={perm}
                    >
                      {perm.replace('android.permission.', '')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hardcoded Secrets */}
            {securityAudit.hardcodedSecrets.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
                  Hardcoded Secrets & API Keys ({securityAudit.hardcodedSecrets.length})
                </div>
                <div className="space-y-1">
                  {securityAudit.hardcodedSecrets.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] space-y-0.5"
                    >
                      <div className="text-rose-400 font-bold">{s.type}</div>
                      <div className="text-slate-400 truncate">File: {s.file}</div>
                      <div className="text-slate-200 bg-slate-900 p-1 rounded select-all truncate">
                        {s.matchedString}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACTIVE FILE DETAILS TAB */}
        {activeTab === 'meta' && (
          <div className="space-y-3 font-mono">
            <div className="space-y-1 text-slate-300">
              <div className="text-[10px] uppercase text-slate-500">File Path</div>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] break-all">
                {activeFile.path}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500">File Size</div>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {formatBytes(activeFile.size)}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500">Category</div>
                <div className="text-slate-200 font-semibold mt-0.5 uppercase">
                  {activeFile.category}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-slate-300">
              <div className="text-[10px] uppercase text-slate-500">SHA-256 Digest</div>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-blue-400 break-all select-all">
                {activeFile.sha256}
              </div>
            </div>

            {activeFile.dexAnalysis && (
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-200 text-xs">DEX Module Stats</div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Classes:</span>
                  <span className="text-slate-200 font-bold">{activeFile.dexAnalysis.classesCount}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Methods:</span>
                  <span className="text-slate-200 font-bold">{activeFile.dexAnalysis.methodsCount}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Fields:</span>
                  <span className="text-slate-200 font-bold">{activeFile.dexAnalysis.fieldsCount}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Strings:</span>
                  <span className="text-slate-200 font-bold">{activeFile.dexAnalysis.stringsCount}</span>
                </div>
              </div>
            )}

            {activeFile.elfAnalysis && (
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-200 text-xs">Native Library Stats</div>
                <div className="text-slate-400 text-[11px]">
                  Arch: <span className="text-slate-200">{activeFile.elfAnalysis.header.machine}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Dependencies: <span className="text-blue-400">{activeFile.elfAnalysis.dependencies.length}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Exports: <span className="text-emerald-400">{activeFile.elfAnalysis.exportedSymbols.length}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* APK MANIFEST TAB */}
        {activeTab === 'manifest' && report.apkMetadata && (
          <div className="space-y-3 font-mono">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase text-slate-500">Package Identifier</div>
              <div className="text-blue-400 font-semibold text-xs select-all">
                {report.apkMetadata.packageName}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500">Version</div>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {report.apkMetadata.versionName} ({report.apkMetadata.versionCode})
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500">SDK Target</div>
                <div className="text-slate-200 font-semibold mt-0.5">
                  Min: {report.apkMetadata.minSdkVersion} / Target: {report.apkMetadata.targetSdkVersion}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 text-xs">Components Declared</div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Activities:</span>
                <span className="text-slate-200 font-bold">{report.apkMetadata.activities.length}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Services:</span>
                <span className="text-slate-200 font-bold">{report.apkMetadata.services.length}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Receivers:</span>
                <span className="text-slate-200 font-bold">{report.apkMetadata.receivers.length}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Providers:</span>
                <span className="text-slate-200 font-bold">{report.apkMetadata.providers.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
