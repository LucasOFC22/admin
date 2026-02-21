import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, contexto, nivel } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      console.error('GEMINI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'GEMINI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Selecionar modelo baseado no nível
    let model = 'gemini-2.5-flash-lite';
    let maxTokens = 1024;
    
    if (nivel === 'medio') {
      model = 'gemini-2.5-flash';
      maxTokens = 2048;
    } else if (nivel === 'completo') {
      model = 'gemini-2.5-pro-preview-06-05';
      maxTokens = 4096;
    }

    console.log(`[DRE-IA] Usando modelo: ${model}, nivel: ${nivel}`);

    const finalPrompt = `
Responda APENAS em JSON válido.
Não use markdown.
Não escreva nada fora do JSON.

${contexto ? contexto + '\n\n' : ''}
Usuário:
${prompt}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: finalPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini error ${response.status}: ${errText}`);
      throw new Error(`Gemini error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    console.log('[DRE-IA] Resposta Gemini recebida');

    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let data = null;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
    }

    return new Response(
      JSON.stringify({ success: true, data, raw: rawText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na IA:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
