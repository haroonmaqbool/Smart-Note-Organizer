import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface TextItem {
  str: string;
  [key: string]: any;
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
      const worker = await createWorker('eng');
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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
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