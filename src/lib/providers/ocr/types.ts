export interface OcrInput {
  fileUrl: string;
  mimeType: string;
}

export interface OcrResult {
  text: string;
  blocks?: Array<{ text: string; confidence?: number; bbox?: [number, number, number, number] }>;
  rawResponse?: unknown;
}

export interface IOcrProvider {
  readonly id: string;
  parse(input: OcrInput): Promise<OcrResult>;
}
