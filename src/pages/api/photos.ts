import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { commitAndPush } from '../../utils/git';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { data, name } = await request.json();

    if (!data || !name) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    const buffer = Buffer.from(data, 'base64');
    
    // Optimizar con sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Generar nombre seguro con extensión .webp
    const baseName = path.parse(name).name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const finalFileName = `${baseName}-${Date.now()}.webp`;

    const publicPath = path.join(process.cwd(), 'public', 'photos', finalFileName);
    fs.writeFileSync(publicPath, optimizedBuffer);

    // Mantener el workaround para disponibilidad inmediata en dev/prod si existe dist
    const distPath = path.join(process.cwd(), 'dist', 'client', 'photos');
    if (fs.existsSync(distPath)) {
      fs.writeFileSync(path.join(distPath, finalFileName), optimizedBuffer);
    }

    await commitAndPush(`Admin: Foto subida y optimizada ${finalFileName}`);

    return new Response(JSON.stringify({ success: true, fileName: finalFileName }), { status: 200 });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { id } = data; // En el frontend pasamos 'fileName' como id

    if (!id) {
      return new Response(JSON.stringify({ error: 'Falta el nombre del archivo' }), { status: 400 });
    }

    const publicPath = path.join(process.cwd(), 'public', 'photos', id);
    if (fs.existsSync(publicPath)) {
      fs.unlinkSync(publicPath);
    }

    const distPath = path.join(process.cwd(), 'dist', 'client', 'photos', id);
    if (fs.existsSync(distPath)) {
      fs.unlinkSync(distPath);
    }

    await commitAndPush(`Admin: Foto eliminada ${id}`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
