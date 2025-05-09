import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
// Using a more type-safe approach for importing PDF.js worker
const pdfjsWorkerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

interface TextItem {
  str: string;
  [key: string]: any;
}

// Extend the Tesseract Worker type since TypeScript doesn't know about all methods
interface TesseractWorker {
  load(): Promise<any>;
  loadLanguage(lang: string): Promise<any>;
  initialize(lang: string): Promise<any>;
  recognize(image: File | string): Promise<any>;
  terminate(): Promise<any>;
}

export const fileUtils = {
  async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as TextItem[];
        text += items.map((item) => item.str).join(' ') + '\n';
      }

      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  },

  async performOCR(file: File): Promise<string> {
    try {
      // Use our extended type
      const worker = await createWorker('eng') as unknown as TesseractWorker;
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data } = await worker.recognize(file);
      await worker.terminate();
      
      return data.text;
    } catch (error) {
      console.error('Error performing OCR:', error);
      return '';
    }
  },

  async readTextFile(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        resolve(typeof result === 'string' ? result : '');
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  async processFile(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return this.extractTextFromPDF(file);
    } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
      return this.readTextFile(file);
    } else if (file.type.startsWith('image/')) {
      return this.performOCR(file);
    } else {
      throw new Error('Unsupported file type');
    }
  },
}; 