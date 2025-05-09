import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

export const fileUtils = {
  async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }

    return text;
  },

  async performOCR(file: File): Promise<string> {
    const worker = await createWorker();
    // @ts-ignore - Tesseract.js types are not properly exported
    await worker.loadLanguage('eng');
    // @ts-ignore - Tesseract.js types are not properly exported
    await worker.initialize('eng');
    
    // @ts-ignore - Tesseract.js types are not properly exported
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    
    return text;
  },

  async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  async processFile(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return this.extractTextFromPDF(file);
    } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
      return this.readTextFile(file);
    } else {
      throw new Error('Unsupported file type');
    }
  },
}; 