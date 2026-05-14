import type { APIRoute } from 'astro';
import { CmsService } from '../../utils/cms-service';
import { collections } from '../../content.config';

const collection = 'comunidad';
const schema = collections[collection].schema;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const result = await CmsService.createItem(collection, data, schema);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) return new Response(JSON.stringify({ error: 'Falta el id' }), { status: 400 });
    
    const result = await CmsService.updateItem(collection, id, data, schema);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) return new Response(JSON.stringify({ error: 'Falta el id' }), { status: 400 });

    const result = await CmsService.deleteItem(collection, id);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
