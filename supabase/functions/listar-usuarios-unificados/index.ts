import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept, prefer, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user token for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for service-level operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch all 3 datasets in parallel
    const [usuariosResult, cargosResult, currentUserResult] = await Promise.all([
      supabaseAdmin.from("usuarios").select("*").order("nome"),
      supabaseAdmin.from("cargos").select("*"),
      supabaseAdmin
        .from("usuarios")
        .select("cargo")
        .eq("supabase_id", user.id)
        .maybeSingle(),
    ]);

    if (usuariosResult.error) {
      throw new Error(`Erro ao buscar usuários: ${usuariosResult.error.message}`);
    }

    const usuarios = usuariosResult.data || [];
    const cargos = cargosResult.data || [];
    const cargosAtivos = cargos.filter((c: any) => c.ativo !== false);

    // Get current user's cargo level
    let currentUserLevel = 1;
    if (currentUserResult.data?.cargo) {
      const cargoInfo = cargos.find((c: any) => c.id === currentUserResult.data.cargo);
      currentUserLevel = cargoInfo?.level || 1;
    }

    // Fetch auth users for email verification using admin API
    // Supabase admin listUsers with pagination to get all
    const authUsersMap: Record<string, boolean> = {};
    const supabaseIds = usuarios
      .filter((u: any) => u.supabase_id)
      .map((u: any) => u.supabase_id);

    if (supabaseIds.length > 0) {
      try {
        let page = 1;
        const perPage = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: listData, error: listError } =
            await supabaseAdmin.auth.admin.listUsers({
              page,
              perPage,
            });

          if (listError) {
            console.error("Erro ao listar auth users:", listError);
            break;
          }

          const authUsers = listData?.users || [];
          for (const authUser of authUsers) {
            if (supabaseIds.includes(authUser.id)) {
              authUsersMap[authUser.id] = !!authUser.email_confirmed_at;
            }
          }

          hasMore = authUsers.length === perPage;
          page++;
        }
      } catch (err) {
        console.error("Erro ao buscar verificação de email:", err);
      }
    }

    // Combine data
    const usuariosComCargo = usuarios.map((usuario: any) => {
      const cargoInfo = cargos.find((c: any) => c.id === usuario.cargo);
      return {
        ...usuario,
        cargo_info: cargoInfo || null,
        email_verified: usuario.supabase_id
          ? authUsersMap[usuario.supabase_id] ?? null
          : null,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        usuarios: usuariosComCargo,
        cargos: cargosAtivos,
        currentUserLevel,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na edge function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro interno",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
