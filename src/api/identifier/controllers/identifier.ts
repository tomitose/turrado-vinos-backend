import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default {
  /**
   * Controlador para identificar una imagen de vino.
   * @param ctx El contexto de la petición de Strapi
   */
  async identifyImage(ctx) {
    const { imageBase64 } = ctx.request.body as { imageBase64: string };

    if (!imageBase64) {
      return ctx.badRequest('No se proporcionó ninguna imagen.');
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto sommelier y especialista en identificar datos de etiquetas de vinos y otras bebidas alcoholicas a partir de imágenes. Tu única función es analizar la imagen que te provea el usuario y devolver un objeto JSON. Contesta únicamente en formato JSON con la siguiente estructura y parámetros. No incluyas texto adicional, explicaciones, ni la palabra "json" al principio. { "nombre_vino": "NOMBRE DEL VINO O BEBIDA", "cepa": "VARIETAL PRINCIPAL, ej: Malbec, Cabernet Sauvignon, etc.", "bodega": "NOMBRE DE LA BODEGA", "anada": "AÑO DEL VINO en formato de 4 dígitos, ej: 2022" }. Si no estás seguro de algún campo porque no es legible en la etiqueta, coloca null en su valor.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identifica los datos de la etiqueta de este vino o bebida.' },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });

      const aiResult = JSON.parse(response.choices[0].message.content);
      console.log('Respuesta de la IA:', aiResult);

      const { nombre_vino, cepa } = aiResult;
      
      if (!nombre_vino) {
        return ctx.send({ matches: [] });
      }

      const entries = await strapi.entityService.findMany('api::vino.vino', {
        filters: {
          $or: [
            { nombre: { $containsi: nombre_vino } },
            { cepa: { $containsi: cepa } },
          ],
        },
      });
      
      return ctx.send({ matches: entries });

    } catch (error) {
      console.error('Error al procesar la imagen con OpenAI:', error);
      return ctx.internalServerError('Error procesando la imagen.');
    }
  },
};