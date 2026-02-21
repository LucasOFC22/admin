// --- Imports ---
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Função principal ---
serve(async (req) => {

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Tenta ler o corpo JSON ---
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Body inválido (não é JSON)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { token, novaSenha } = body;

  if (!token || !novaSenha) {
    return new Response(
      JSON.stringify({ error: "Token e nova senha são obrigatórios" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // --- Consulta token via função SQL segura ---
    const { data: tokenRow, error: tokenError } = await supabase
      .rpc("get_recovery_token_info", { p_token: token })
      .maybeSingle();

    if (tokenError || !tokenRow) {
      throw new Error("Token inválido ou expirado");
    }

    const userId = (tokenRow as { user_id: string }).user_id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: novaSenha },
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Senha atualizada com sucesso" }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[CATCH ERROR]", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message ?? "Erro interno" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
