// Node.js type declarations for StressGPT7
declare module 'child_process' {
  export interface ChildProcess {
    killed: boolean;
    signalCode: number | null;
    exitCode: number | null;
    stdin: any;
    stdout: any;
    stderr: any;
  }
  
  export function spawn(command: string, args?: string[], options?: any): ChildProcess;
  export function exec(command: string, callback?: (error: Error | null, stdout: string, stderr: string) => void): ChildProcess;
}

declare module 'fs/promises' {
  export function writeFile(path: string | URL, data: string | Uint8Array, options?: any): Promise<void>;
  export function readFile(path: string | URL, options?: any): Promise<Buffer>;
  export function unlink(path: string | URL): Promise<void>;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
}

declare module 'os' {
  export function tmpdir(): string;
  export function platform(): string;
  export function arch(): string;
  export function cpus(): any[];
  export function totalmem(): number;
  export function freemem(): number;
}

declare module 'util' {
  export function promisify(fn: Function): Function;
}
