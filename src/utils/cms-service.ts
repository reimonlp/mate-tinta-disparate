import fs from 'node:fs';
import path from 'node:path';
import { generateMarkdown } from './markdown';
import { commitAndPush } from './git';
import type { ZodSchema } from 'zod';

export class CmsService {
  private static getContentPath(collection: string, id?: string) {
    const base = path.join(process.cwd(), 'src', 'content', collection);
    if (!id) return base;
    const fileName = id.endsWith('.md') ? id : `${id}.md`;
    return path.join(base, fileName);
  }

  static async createItem(collection: string, data: any, schema: ZodSchema, bodyField: string = 'text') {
    // Validate data
    const validatedData = schema.parse(data);
    const body = data[bodyField] || '';

    // Generate filename
    const nameSeed = validatedData.autor || validatedData.pregunta || validatedData.nombre || 'item';
    const safeName = nameSeed.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 20);
    const fileName = `${safeName}-${Date.now()}.md`;
    const filePath = this.getContentPath(collection, fileName);

    // Write file
    const content = generateMarkdown(validatedData, body);
    fs.writeFileSync(filePath, content, 'utf-8');

    // Persist
    await commitAndPush(`Admin: Añadido item a ${collection}`);
    return { success: true, id: fileName };
  }

  static async updateItem(collection: string, id: string, data: any, schema: ZodSchema, bodyField: string = 'text') {
    const filePath = this.getContentPath(collection, id);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Item ${id} not found in ${collection}`);
    }

    // Validate data
    const validatedData = schema.parse(data);
    const body = data[bodyField] || '';

    // Write file
    const content = generateMarkdown(validatedData, body);
    fs.writeFileSync(filePath, content, 'utf-8');

    // Persist
    await commitAndPush(`Admin: Editado item ${id} en ${collection}`);
    return { success: true };
  }

  static async deleteItem(collection: string, id: string) {
    const filePath = this.getContentPath(collection, id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      await commitAndPush(`Admin: Eliminado item ${id} en ${collection}`);
    }
    return { success: true };
  }
}
