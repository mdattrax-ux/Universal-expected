import JSZip from 'jszip';
import { CodeFile } from '../types';

// Map extensions to readable language labels
const EXT_MAP: Record<string, string> = {
  xml: 'XML',
  kt: 'Kotlin',
  kts: 'Kotlin Script',
  java: 'Java',
  py: 'Python',
  js: 'JavaScript',
  jsx: 'React JSX',
  ts: 'TypeScript',
  tsx: 'React TSX',
  json: 'JSON',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  c: 'C',
  cpp: 'C++',
  h: 'C Header',
  hpp: 'C++ Header',
  cs: 'C#',
  go: 'Go',
  rs: 'Rust',
  php: 'PHP',
  rb: 'Ruby',
  swift: 'Swift',
  dart: 'Dart',
  sh: 'Shell Script',
  bash: 'Bash',
  zsh: 'Zsh',
  sql: 'SQL',
  yaml: 'YAML',
  yml: 'YAML',
  gradle: 'Gradle',
  properties: 'Properties',
  md: 'Markdown',
  txt: 'Plain Text',
  ini: 'INI',
  toml: 'TOML',
  svg: 'SVG (XML)',
};

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf', 'zip', 'tar', 'gz', '7z', 'rar',
  'exe', 'dll', 'so', 'dylib', 'bin', 'jar', 'war', 'class', 'dex', 'apk', 'aab',
  'ttf', 'otf', 'woff', 'woff2', 'eot', 'mp3', 'mp4', 'wav', 'ogg', 'webm', 'mov'
]);

export function detectLanguage(filename: string): { extension: string; language: string } {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  const language = EXT_MAP[ext] || (ext ? ext.toUpperCase() : 'Plain Text');
  return { extension: ext, language };
}

export function isCodeFile(filename: string): boolean {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  if (BINARY_EXTENSIONS.has(ext)) return false;
  // Exclude unwanted directories in zip
  if (
    filename.includes('/.git/') ||
    filename.includes('/node_modules/') ||
    filename.includes('/build/') ||
    filename.includes('/.gradle/') ||
    filename.includes('/dist/')
  ) {
    return false;
  }
  return true;
}

export function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export async function parseUploadedFiles(files: FileList | File[]): Promise<CodeFile[]> {
  const result: CodeFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.name.toLowerCase().endsWith('.zip')) {
      const zipFiles = await parseZipFile(file);
      result.push(...zipFiles);
    } else {
      const codeFile = await readSingleFile(file);
      if (codeFile) {
        result.push(codeFile);
      }
    }
  }

  return result;
}

async function readSingleFile(file: File): Promise<CodeFile | null> {
  const { extension, language } = detectLanguage(file.name);
  if (BINARY_EXTENSIONS.has(extension)) {
    return null;
  }

  try {
    const rawContent = await file.text();
    const content = normalizeLineBreaks(rawContent);
    const lines = content.split('\n');

    return {
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      path: file.name,
      extension,
      language,
      content,
      linesCount: lines.length,
      sizeBytes: file.size,
      selected: true,
    };
  } catch (err) {
    console.error(`Error reading file ${file.name}:`, err);
    return null;
  }
}

async function parseZipFile(file: File): Promise<CodeFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const result: CodeFile[] = [];

  const entries: Array<{ path: string; fileObj: JSZip.JSZipObject }> = [];
  loadedZip.forEach((relativePath, fileObj) => {
    if (!fileObj.dir && isCodeFile(relativePath)) {
      entries.push({ path: relativePath, fileObj });
    }
  });

  for (const entry of entries) {
    try {
      const rawContent = await entry.fileObj.async('string');
      // Basic heuristic to skip binary garbage that might not have standard ext
      if (/[\x00-\x08\x0E-\x1F]/.test(rawContent.slice(0, 1000))) {
        continue; // Binary detected
      }
      const content = normalizeLineBreaks(rawContent);
      const lines = content.split('\n');
      const filename = entry.path.split('/').pop() || entry.path;
      const { extension, language } = detectLanguage(filename);

      result.push({
        id: `${entry.path}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: filename,
        path: entry.path,
        extension,
        language,
        content,
        linesCount: lines.length,
        sizeBytes: rawContent.length,
        selected: true,
      });
    } catch (e) {
      console.warn(`Could not read zip entry ${entry.path}:`, e);
    }
  }

  return result;
}
