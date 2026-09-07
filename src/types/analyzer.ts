/**
 * MASTER DEVELOPER SPECIFICATION
 * Complete Type Definitions for Universal File Analyzer
 */

export type FileCategory =
  | 'archive'
  | 'apk'
  | 'dex'
  | 'xml'
  | 'axml'
  | 'elf'
  | 'arsc'
  | 'code'
  | 'text'
  | 'image'
  | 'audio'
  | 'zip'
  | 'binary';

export interface DetectionResult {
  category: FileCategory;
  mimeType: string;
  signature: string;
  magicBytesHex: string;
  formatName: string;
  description: string;
  isContainer: boolean;
  isText: boolean;
  extension: string;
}

export interface DexClassInfo {
  name: string;
  accessFlags: string;
  superClass: string;
  interfaces: string[];
  fields: Array<{ name: string; type: string; access: string }>;
  methods: Array<{ name: string; returnType: string; params: string[]; access: string }>;
  decompiledCode: string;
}

export interface DexAnalysis {
  header: {
    magic: string;
    version: string;
    fileSize: number;
    headerSize: number;
    endianTag: string;
    classDefsSize: number;
    methodIdsSize: number;
    stringIdsSize: number;
  };
  classesCount: number;
  methodsCount: number;
  fieldsCount: number;
  stringsCount: number;
  classes: DexClassInfo[];
  disassembledRepresentation: string;
}

export interface ElfAnalysis {
  header: {
    classBits: '32-bit' | '64-bit';
    dataEndian: 'Little Endian' | 'Big Endian';
    version: number;
    abi: string;
    type: string;
    machine: string;
    entryPoint: string;
  };
  sections: Array<{ name: string; type: string; address: string; size: number }>;
  dependencies: string[];
  exportedSymbols: string[];
  importedSymbols: string[];
  stringsSummary: string[];
}

export interface ArscAnalysis {
  packageNames: string[];
  typesCount: number;
  resourcesCount: number;
  types: Array<{ name: string; count: number }>;
  decompiledSummary: string;
}

export interface ApkMetadata {
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: string;
  targetSdkVersion: string;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  nativeArchitectures: string[];
  dexFilesCount: number;
  hasNativeLibraries: boolean;
  signingInfo: {
    v1Signed: boolean;
    v2Signed: boolean;
    v3Signed: boolean;
    certSigners: string[];
  };
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  recommendation: string;
}

export interface SecurityAudit {
  riskScore: number;
  debuggable: boolean;
  allowBackup: boolean;
  usesCleartextTraffic: boolean;
  sensitivePermissions: string[];
  vulnerabilities: SecurityVulnerability[];
  hardcodedSecrets: Array<{ type: string; file: string; matchedString: string }>;
  detectedTrackers: string[];
}

export interface ExtractedFile {
  path: string;
  name: string;
  size: number;
  linesCount?: number;
  category: FileCategory;
  isBinary: boolean;
  decodedContent?: string;
  isDecoded: boolean;
  rawBytes?: Uint8Array;
  sha256?: string;
  dexAnalysis?: DexAnalysis;
  elfAnalysis?: ElfAnalysis;
  arscAnalysis?: ArscAnalysis;
}

export interface ProcessedArchive {
  totalFiles: number;
  totalUncompressedSize: number;
  manifest?: ApkMetadata;
  dexAnalyses: DexAnalysis[];
  elfAnalyses: ElfAnalysis[];
  arscAnalysis?: ArscAnalysis;
}

export interface FileAnalysisReport {
  fileName: string;
  fileSize: number;
  detection: DetectionResult;
  isArchive: boolean;
  extractedFiles: ExtractedFile[];
  archive?: ProcessedArchive;
  apkMetadata?: ApkMetadata;
  error?: string;
}
