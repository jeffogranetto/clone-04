// Cloudflare Pages Function: POST /api/lead
// Recebe o submit do formulário de captura e dispara para
// ActiveCampaign (criar/atualizar contato + aplicar tag) e Clint Digital
// em paralelo, sem CORS headaches (server-side).
//
// ── CONFIGURAÇÃO ──
// Substitua os placeholders abaixo pelos valores reais antes do deploy:
//   AC_API_URL        → URL do ActiveCampaign (ex.: https://seudominio.api-us1.com)
//   AC_API_KEY        → API Key do ActiveCampaign
//   AC_TAG_NAME       → Nome da tag a ser aplicada aos leads
//   CLINT_WEBHOOK_URL → URL completa do webhook do Clint
//
// Em produção, prefira mover essas strings para Environment Variables no
// painel do Cloudflare Pages e consumir via context.env.AC_API_KEY, etc.

export async function onRequestPost(context) {
  const { request } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const {
      name, email, phone, formacao,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    } = body;

    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatorios: name, email, phone' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // ── ActiveCampaign ──
    const AC_API_URL  = (context.env && context.env.AC_API_URL)  || 'https://SEU_DOMINIO.api-us1.com';
    const AC_API_KEY  = (context.env && context.env.AC_API_KEY)  || 'SUA_API_KEY_AQUI';
    const AC_TAG_NAME = (context.env && context.env.AC_TAG_NAME) || 'NOME_DA_TAG_AQUI';

    const acHeaders = {
      'Api-Token': AC_API_KEY,
      'Content-Type': 'application/json',
    };

    const acPromise = (async () => {
      try {
        const contactRes = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
          method: 'POST',
          headers: acHeaders,
          body: JSON.stringify({
            contact: {
              email,
              firstName: name.split(' ')[0],
              lastName:  name.split(' ').slice(1).join(' ') || '',
              phone,
            },
          }),
        });
        const contactData = await contactRes.json();
        const contactId = contactData?.contact?.id;

        if (contactId && AC_TAG_NAME) {
          const tagSearchRes = await fetch(
            `${AC_API_URL}/api/3/tags?search=${encodeURIComponent(AC_TAG_NAME)}`,
            { headers: acHeaders }
          );
          const tagSearchData = await tagSearchRes.json();
          const tag = tagSearchData?.tags?.find(t => t.tag === AC_TAG_NAME);
          if (tag) {
            await fetch(`${AC_API_URL}/api/3/contactTags`, {
              method: 'POST',
              headers: acHeaders,
              body: JSON.stringify({ contactTag: { contact: contactId, tag: tag.id } }),
            });
          }
        }
        return { contactId };
      } catch (acErr) {
        return { error: acErr.message };
      }
    })();

    // ── Clint Digital ──
    const CLINT_WEBHOOK_URL = (context.env && context.env.CLINT_WEBHOOK_URL)
      || 'https://functions-api.clint.digital/endpoints/integration/webhook/c8a92c25-f534-4dfd-aa4c-64676173359b';

    const clintPromise = (async () => {
      try {
        const clintRes = await fetch(CLINT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: name,
            email,
            phone,
            formacao: formacao || '',
            utm_source:   utm_source   || '',
            utm_medium:   utm_medium   || '',
            utm_campaign: utm_campaign || '',
            utm_term:     utm_term     || '',
            utm_content:  utm_content  || '',
          }),
        });
        return { status: clintRes.status };
      } catch (clintErr) {
        return { error: clintErr.message };
      }
    })();

    const [acResult, clintResult] = await Promise.allSettled([acPromise, clintPromise]);

    return new Response(
      JSON.stringify({
        success: true,
        ac:    acResult.status    === 'fulfilled' ? acResult.value    : { error: String(acResult.reason) },
        clint: clintResult.status === 'fulfilled' ? clintResult.value : { error: String(clintResult.reason) },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno', detail: err && err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Responde preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
