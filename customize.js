// Customizações da LP — clone FSC/UAG
// ------------------------------------------------------------------
// Aplica, de forma idempotente, sobre o index.html clonado:
//   1. Barra superior "ÚLTIMAS VAGAS COM BOLSA DE ATÉ 30%"
//   2. Google Tag Manager no <head>
//   3. Troca de todos os botões "CADASTRAR" por "QUERO MAIS INFORMAÇÕES"
//   4. Modal de captura de lead (Nome, E-mail, Telefone, Formação)
//   5. Fluxo de submit: fetch /api/lead + sendBeacon fallback + redirect /obrigado.html
//   6. Oculta o form inline original (substituído pelo modal)
// ------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, 'index.html');
let html = fs.readFileSync(P, 'utf8');

// -------- Limpeza de injeções anteriores (idempotência) --------
html = html.replace(/<style id="form-toggle-css">[\s\S]*?<\/style>\s*/g, '');
html = html.replace(/<script id="form-toggle-js">[\s\S]*?<\/script>\s*/g, '');
html = html.replace(/<script id="formacao-js">[\s\S]*?<\/script>\s*/g, '');
html = html.replace(/<style id="custom-css">[\s\S]*?<\/style>\s*/g, '');
html = html.replace(/<script id="custom-js">[\s\S]*?<\/script>\s*/g, '');
html = html.replace(/<script id="custom-gtm">[\s\S]*?<\/script>\s*/g, '');
html = html.replace(/<div id="promo-bar"[^>]*>[\s\S]*?<\/div>\s*/g, '');
html = html.replace(/<div id="lead-modal"[\s\S]*?<!-- \/lead-modal -->\s*/g, '');

// -------- 1) Barra superior promocional --------
const PROMO_BAR = `<div id="promo-bar">🔥 ÚLTIMAS VAGAS COM BOLSA DE ATÉ 30%</div>`;
html = html.replace(/<body([^>]*)>/, (m, attrs) => `<body${attrs}>${PROMO_BAR}`);

// -------- 2) Google Tag Manager no <head> --------
const GTM = `
<!-- Google Tag Manager -->
<script id="custom-gtm">(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://load.traker.fundacoessemcomplicacoes.com.br/awvoctqkzh.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','42cfn=AR5WNiAuQj1fKFkmRlZWUB5HWV9FRQsYVRweHxACDBkNCRgUGQAAGxgWAhIVAAATG1QIHhlNDQQ%3D');</script>
<!-- End Google Tag Manager -->
`;

// -------- 3) Estilos do modal + barra + CTAs --------
const CUSTOM_CSS = `
<style id="custom-css">
  /* Barra promocional */
  #promo-bar{position:relative;z-index:9999;width:100%;background:linear-gradient(90deg,#e45a00,#f77b00);color:#fff;text-align:center;padding:10px 12px;font-family:Montserrat,sans-serif;font-weight:800;font-size:15px;letter-spacing:.5px;text-transform:uppercase;box-shadow:0 2px 8px rgba(0,0,0,.25)}

  /* Esconde o form inline original da LP (substituído pelo modal) */
  form.e_formulario,
  form.e_formulario + .gpc_botao{display:none !important}

  /* CTA do hero (botão grande em destaque que abre o modal) */
  .reveal-form-btn{display:inline-block;background:linear-gradient(135deg,#1fb06b,#3dd184);color:#fff;font-family:Montserrat,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.6px;padding:16px 28px;border-radius:8px;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(31,176,107,.35);transition:transform .15s ease,box-shadow .2s ease;font-size:16px;margin:10px 0}
  .reveal-form-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(31,176,107,.45)}

  /* Modal */
  #lead-modal{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100000;display:none;align-items:center;justify-content:center;padding:20px;font-family:Montserrat,sans-serif}
  #lead-modal.open{display:flex}
  #lead-modal .modal-card{background:#fff;width:100%;max-width:460px;border-radius:14px;padding:28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.5);position:relative;animation:leadModalIn .25s ease-out}
  @keyframes leadModalIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
  #lead-modal .modal-close{position:absolute;top:10px;right:14px;background:none;border:none;font-size:28px;line-height:1;color:#888;cursor:pointer}
  #lead-modal .modal-close:hover{color:#000}
  #lead-modal h3{color:#0b1f1a;font-size:22px;font-weight:800;margin-bottom:6px;text-align:center}
  #lead-modal p.subtitle{color:#555;font-size:14px;margin-bottom:18px;text-align:center}
  #lead-modal .modal-field{display:block;width:100%;padding:13px 14px;margin:8px 0;border:1px solid #d6d6d6;border-radius:7px;font-size:15px;font-family:inherit;color:#222;background:#fff;box-sizing:border-box;transition:border-color .15s}
  #lead-modal .modal-field:focus{outline:none;border-color:#1fb06b;box-shadow:0 0 0 3px rgba(31,176,107,.18)}
  #lead-modal select.modal-field{appearance:auto;-webkit-appearance:menulist;height:46px}
  #lead-modal .modal-submit{display:block;width:100%;background:linear-gradient(135deg,#1fb06b,#3dd184);color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:.5px;padding:15px;border:none;border-radius:7px;font-size:15px;cursor:pointer;margin-top:12px;transition:transform .12s,box-shadow .15s}
  #lead-modal .modal-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(31,176,107,.35)}
  #lead-modal .modal-submit:disabled{opacity:.6;cursor:not-allowed}
  #lead-modal .modal-privacy{font-size:11px;color:#888;text-align:center;margin-top:10px}
</style>
`;

// -------- 4) HTML do modal --------
const MODAL_HTML = `
<div id="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
  <div class="modal-card">
    <button type="button" class="modal-close" aria-label="Fechar">&times;</button>
    <h3 id="lead-modal-title">Quero mais informações</h3>
    <p class="subtitle">Preencha seus dados e fale com um consultor.</p>
    <form id="lead-form" novalidate>
      <input class="modal-field" type="text"  name="name"     placeholder="Nome completo" required autocomplete="name">
      <input class="modal-field" type="email" name="email"    placeholder="E-mail" required autocomplete="email">
      <input class="modal-field" type="tel"   name="phone"    placeholder="(00) 00000-0000" required autocomplete="tel">
      <select class="modal-field" name="formacao" required>
        <option value="" disabled selected>Formação</option>
        <option value="graduacao-em-andamento">Graduação em andamento</option>
        <option value="graduado">Graduado</option>
        <option value="pos-graduado">Pós-graduado</option>
        <option value="ensino-medio">Ensino médio</option>
      </select>
      <button type="submit" class="modal-submit">QUERO MAIS INFORMAÇÕES</button>
      <p class="modal-privacy">Seus dados estão protegidos e serão usados apenas para contato sobre o curso.</p>
    </form>
  </div>
</div>
<!-- /lead-modal -->
`;

// -------- 5) JavaScript (abertura do modal, máscara telefone, submit) --------
const CUSTOM_JS = `
<script id="custom-js">
(function(){
  // Util — máscara (00) 00000-0000
  function maskPhone(v){
    v = v.replace(/\\D/g,'').slice(0,11);
    if(v.length>10) return v.replace(/(\\d{2})(\\d{5})(\\d{0,4}).*/,'($1) $2-$3');
    if(v.length>6)  return v.replace(/(\\d{2})(\\d{4})(\\d{0,4}).*/,'($1) $2-$3');
    if(v.length>2)  return v.replace(/(\\d{2})(\\d{0,5}).*/,'($1) $2');
    if(v.length>0)  return v.replace(/(\\d{0,2}).*/,'($1');
    return '';
  }
  function getUTMs(){
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source:   p.get('utm_source')   || '',
      utm_medium:   p.get('utm_medium')   || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_term:     p.get('utm_term')     || '',
      utm_content:  p.get('utm_content')  || ''
    };
  }
  function redirect(name, email, phone, formacao, utms){
    var p = new URLSearchParams();
    p.set('nome', name);
    p.set('email', email);
    p.set('whatsapp', phone);
    p.set('formacao', formacao);
    if(utms.utm_source)   p.set('utm_source',   utms.utm_source);
    if(utms.utm_medium)   p.set('utm_medium',   utms.utm_medium);
    if(utms.utm_campaign) p.set('utm_campaign', utms.utm_campaign);
    if(utms.utm_term)     p.set('utm_term',     utms.utm_term);
    if(utms.utm_content)  p.set('utm_content',  utms.utm_content);
    window.location.href = '/obrigado.html?' + p.toString();
  }

  var modal, form, phoneInput;
  function openModal(){
    if(!modal) return;
    modal.classList.add('open');
    document.body.style.overflow='hidden';
    setTimeout(function(){ var n=form.querySelector('input[name="name"]'); if(n) n.focus(); },60);
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow='';
  }

  function bindCtas(){
    // Renomeia todos os CADASTRAR para QUERO MAIS INFORMAÇÕES
    document.querySelectorAll('a.e_botao, .gpc_botao, .gpc_botao span').forEach(function(el){
      (function walk(n){
        for(var i=0;i<n.childNodes.length;i++){
          var c=n.childNodes[i];
          if(c.nodeType===3 && /cadastrar/i.test(c.nodeValue)) c.nodeValue = c.nodeValue.replace(/cadastrar/gi,'QUERO MAIS INFORMAÇÕES');
          else if(c.nodeType===1) walk(c);
        }
      })(el);
    });
    // Intercepta cliques em CTAs de âncora/submit para abrir o modal
    var selectors = [
      'a.e_botao',
      '.reveal-form-btn',
      '.gpc_botao',
      'a[href*="#form"]',
      'a[href*="#cadastrar"]'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(function(el){
      if(el.__leadBound) return; el.__leadBound=true;
      el.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        openModal();
      }, true);
    });
  }

  function placeHeroButton(){
    // Insere o botão principal "QUERO MAIS INFORMAÇÕES" onde o form inline existia
    var formInline = document.querySelector('form.e_formulario');
    if(!formInline) return;
    if(document.querySelector('.reveal-form-btn')) return;
    var btn = document.createElement('button');
    btn.type='button';
    btn.className='reveal-form-btn';
    btn.innerText='QUERO MAIS INFORMAÇÕES';
    btn.addEventListener('click', openModal);
    formInline.parentNode.insertBefore(btn, formInline);
  }

  function init(){
    modal = document.getElementById('lead-modal');
    if(!modal) return;
    form  = modal.querySelector('#lead-form');
    phoneInput = form.querySelector('input[name="phone"]');

    // Fechar modal: botão X, clique fora do card, ESC
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });

    // Máscara telefone
    phoneInput.addEventListener('input', function(){ phoneInput.value = maskPhone(phoneInput.value); });

    // Submit
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!form.reportValidity()) return;
      var btn = form.querySelector('.modal-submit');
      btn.disabled = true;
      btn.textContent = 'ENVIANDO...';

      var utms = getUTMs();
      var name     = form.querySelector('[name="name"]').value.trim();
      var email    = form.querySelector('[name="email"]').value.trim();
      var phone    = form.querySelector('[name="phone"]').value.trim();
      var formacao = form.querySelector('[name="formacao"]').value;

      var data = {
        name: name, email: email, phone: phone, formacao: formacao,
        utm_source: utms.utm_source, utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign, utm_term: utms.utm_term,
        utm_content: utms.utm_content
      };

      // Payload para Clint (fallback direto) — usa "nome" em português
      var clintPayload = {
        nome: name, email: email, phone: phone, formacao: formacao,
        utm_source: utms.utm_source, utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign, utm_term: utms.utm_term,
        utm_content: utms.utm_content
      };

      fetch('/api/lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      })
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r; })
      .then(function(){ redirect(name, email, phone, formacao, utms); })
      .catch(function(){
        try {
          navigator.sendBeacon(
            'https://functions-api.clint.digital/endpoints/integration/webhook/c8a92c25-f534-4dfd-aa4c-64676173359b',
            new Blob([JSON.stringify(clintPayload)], {type: 'application/json'})
          );
        } catch(_){}
        redirect(name, email, phone, formacao, utms);
      });
    });

    placeHeroButton();
    bindCtas();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Reaplicar CTAs caso o GreatPages re-renderize
  setTimeout(bindCtas, 400);
  setTimeout(bindCtas, 1200);
})();
</script>
`;

// Injeta GTM+CSS no <head>
html = html.replace(/<\/head>/, GTM + CUSTOM_CSS + '</head>');
// Injeta modal+JS antes de </body>
html = html.replace(/<\/body>/, MODAL_HTML + CUSTOM_JS + '</body>');

fs.writeFileSync(P, html);
console.log('Customizações aplicadas: promo-bar, GTM, modal de lead, submit handler, CTAs.');
