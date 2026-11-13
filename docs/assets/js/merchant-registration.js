(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const settings = window.CMF_REGISTRATION_CONFIG || {};
  const demo = settings.mode === 'demo';
  const API = String(settings.apiBase || '/api/comercios').replace(/\/$/, '');
  let config, session = null, verified = false, step = 1, requestId = null, busy = false, completed = false, dirty = false, captchaWidget = null, cooldown = 0, interval;
  const names = ['nombre','apellido','cedula','celular','correo','nombre_comercio','razon_social','ruc','direccion'];
  const labels = { nombre:'Nombre', apellido:'Apellido', cedula:'Documento', celular:'Celular', correo:'Correo', nombre_comercio:'Comercio', razon_social:'Razón social', ruc:'RUC', direccion:'Dirección' };
  const titles = ['Identifícate','Información sobre tu comercio'];
  async function api(route, body, method = 'POST') {
    if (demo) {
      if (typeof window.CMF_DEMO_API !== 'function') throw new Error('No se pudo cargar la demostración. Recarga la página.');
      return window.CMF_DEMO_API(route, body, method, session);
    }
    const isFile = body instanceof FormData;
    let response;
    try {
      response = await fetch(API + route, { method, headers: { ...(session ? { Authorization: 'Bearer ' + session.token } : {}), ...(!isFile && body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : isFile ? body : JSON.stringify(body), credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(55000) });
    } catch { throw new Error('No pudimos conectar con el servicio. Revisa tu conexión e intenta de nuevo.'); }
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw new Error(data?.message || 'El servicio no está disponible en este momento.');
    return data;
  }
  function message(text, info = false) { const el = $('form-message'); el.textContent = text; el.hidden = !text; el.classList.toggle('info', info); if (text) el.focus({ preventScroll: true }); }
  function progress(text) { $('upload-progress').hidden = !text; $('upload-progress').textContent = text; }
  function readData() { return { ...Object.fromEntries(names.map(name => [name, $(name).value.trim()])), consentimiento: $('consentimiento').checked }; }
  function showStep(n) {
    if (n < 1 || n > titles.length) return;
    step = n; message('');
    document.querySelectorAll('[data-panel]').forEach(el => { el.hidden = Number(el.dataset.panel) !== n; });
    document.querySelectorAll('[data-step]').forEach(el => { const i = Number(el.dataset.step); el.classList.toggle('complete', i < n); if (i === n) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current'); });
    $('step-caption').textContent = `PASO ${n} DE ${titles.length}`; $('progress-label').textContent = titles[n-1]; $('progress-fill').style.width = `${n / titles.length * 100}%`;
    $('next').hidden = n === titles.length; $('submit').hidden = n !== titles.length; $('previous').textContent = n === 1 ? 'Volver' : 'Anterior';
    if (n === titles.length) renderSummary();
    const legend = document.querySelector(`[data-panel="${n}"] legend`); legend.tabIndex = -1; legend.focus({ preventScroll: true });
    $('wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function validStep(n) {
    const controls = document.querySelectorAll(`[data-panel="${n}"] input:not(#code), [data-panel="${n}"] textarea`);
    for (const el of controls) if (!el.reportValidity()) return false;
    if (n === 1) {
      const phone = $('celular').value.replace(/[\s()-]/g,'').replace(/^\+507/,'');
      if (!/^6\d{7}$/.test(phone)) { message('Escribe un celular de Panamá de ocho dígitos que comience con 6.'); $('celular').focus(); return false; }
      if (!verified) { message('Verifica tu correo para continuar.'); return false; }
    }
    return true;
  }
  function renderSummary() {
    $('summary').replaceChildren();
    for (const name of names) { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = labels[name]; dd.textContent = $(name).value; $('summary').append(dt, dd); }
  }
  function renderFiles() {
    for (const [key, spec] of Object.entries(config.files)) {
      const card = document.createElement('div'); card.className = 'file-card';
      const label = document.createElement('label'); label.htmlFor = key; label.textContent = spec.label + (spec.required ? ' *' : '');
      if (!spec.required) { const extra = document.createElement('span'); extra.textContent = 'Si aplica'; label.append(extra); }
      const input = document.createElement('input'); Object.assign(input, { type:'file', id:key, name:key, required:spec.required, accept:'.pdf,.jpg,.jpeg,.png' });
      const detail = document.createElement('p'); detail.className = 'file-info'; detail.id = key + '-info'; detail.textContent = 'PDF, JPG o PNG · Máximo 5 MB'; input.setAttribute('aria-describedby',detail.id);
      input.addEventListener('change', () => {
        dirty = true; const f = input.files[0]; input.setCustomValidity('');
        if (f && f.size > config.maxFileBytes) input.setCustomValidity('Este archivo supera los 5 MB.');
        else if (f && !/\.(pdf|jpe?g|png)$/i.test(f.name)) input.setCustomValidity('Selecciona un PDF, JPG o PNG.');
        detail.textContent = f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, JPG o PNG · Máximo 5 MB';
        input.reportValidity();
      });
      card.append(label,input,detail); $('file-fields').append(card);
    }
  }
  function resetCaptcha() { if (captchaWidget !== null) window.grecaptcha?.reset(captchaWidget); }
  function captchaToken() { return captchaWidget !== null ? window.grecaptcha.getResponse(captchaWidget) : ''; }
  function countdown() {
    clearInterval(interval); cooldown = 60;
    const update = () => { $('send-code').disabled = cooldown > 0 || verified; $('send-code').textContent = cooldown > 0 ? `Repetir en ${cooldown}s` : demo ? 'Mostrar código de prueba' : session ? 'Reenviar código' : 'Enviar código de verificación'; };
    update(); interval = setInterval(() => { cooldown = Math.max(0,cooldown-1); update(); if (!cooldown) clearInterval(interval); },1000);
  }
  async function loadCaptcha() {
    if (!config.siteKey) return;
    await new Promise((resolve,reject) => { const script = document.createElement('script'); script.src='https://www.google.com/recaptcha/api.js?render=explicit&hl=es'; script.async=true; script.onload=resolve; script.onerror=reject; document.head.append(script); });
    await new Promise(resolve => window.grecaptcha.ready(resolve));
    captchaWidget = window.grecaptcha.render('captcha', { sitekey: config.siteKey, size: matchMedia('(max-width:400px)').matches ? 'compact' : 'normal' });
  }
  $('correo').addEventListener('input', () => {
    if (requestId) return;
    session=null; verified=false; clearInterval(interval); cooldown=0; $('send-code').disabled=false; $('send-code').hidden=false; $('send-code').textContent=demo?'Mostrar código de prueba':'Enviar código de verificación'; $('code-entry').hidden=true; $('verified').hidden=true; $('code').value=''; $('captcha').hidden=false; resetCaptcha();
  });
  $('send-code').addEventListener('click', async () => {
    if (!$('correo').reportValidity()) return;
    if (!demo && config.mode !== 'local' && !captchaToken()) return message('Completa la verificación de seguridad.');
    $('send-code').disabled=true; message('');
    try {
      const requestedEmail=$('correo').value.trim().toLowerCase();
      const payload={ email:requestedEmail, captchaToken:captchaToken(), website:$('website').value };
      const data=await api(session ? `/sessions/${session.id}/resend` : '/sessions',payload);
      if($('correo').value.trim().toLowerCase()!==requestedEmail) return;
      if (data.id) session={id:data.id,token:data.token};
      $('code-entry').hidden=false; $('code').focus(); countdown();
      if ((demo || config.mode==='local') && data.testCode) { $('local-code').hidden=false; $('local-code').textContent=`${demo?'Demostración':'Solo prueba local'} · Código simulado: ${data.testCode}`; }
    } catch(e) { message(e.message); $('send-code').disabled=false; }
    finally { resetCaptcha(); }
  });
  $('verify-code').addEventListener('click', async () => {
    if (!session) return message('Solicita primero un código.');
    if (!/^\d{6}$/.test($('code').value)) return message('Escribe los seis dígitos del código.');
    $('verify-code').disabled=true; message('');
    try { const original=session; await api(`/sessions/${session.id}/verify`,{code:$('code').value}); if(session!==original)return; verified=true; clearInterval(interval); $('verified').hidden=false; $('code-entry').hidden=true; $('send-code').hidden=true; $('captcha').hidden=true; }
    catch(e) { message(e.message); } finally { $('verify-code').disabled=false; }
  });
  $('start').addEventListener('click', () => { $('welcome').hidden=true; $('wizard').hidden=false; showStep(1); });
  $('next').addEventListener('click', () => { if (validStep(step)) showStep(step+1); });
  $('previous').addEventListener('click', () => { if (step>1) showStep(step-1); else { $('wizard').hidden=true; $('welcome').hidden=false; $('start').focus(); } });
  $('registration').addEventListener('input', e => { dirty=true; if(step===titles.length && names.includes(e.target.id)) renderSummary(); });
  $('registration').addEventListener('keydown', e => { if (e.key==='Enter' && e.target.tagName==='INPUT' && e.target.type!=='file' && step<titles.length) { e.preventDefault(); if(e.target.id==='code') $('verify-code').click(); else $('next').click(); } });
  function lockData(lock) { for (const name of names) $(name).disabled=lock; $('previous').disabled=lock; $('consentimiento').disabled=lock; }
  function lockFiles(lock) { for (const kind of Object.keys(config.files)) $(kind).disabled=lock; }
  function finish(result) {
    completed=true; dirty=false; $('wizard').hidden=true; $('success').hidden=false; $('request-reference').textContent=result.id;
    $('confirmation-email').textContent=demo ? 'Demostración terminada. No enviamos correos ni guardamos expedientes. Los datos de esta prueba se descartan al recargar la página.' : config.mode==='local' ? 'Prueba local completada. El expediente y el correo simulado se guardaron en el equipo donde ejecutas el backend; no se enviaron a Google.' : result.mailStatus==='SENT' ? `Enviamos la confirmación a ${$('correo').value}. Revisa también tu carpeta de spam.` : 'Tu solicitud quedó guardada. Si no recibes el correo, conserva este número como comprobante.';
    $('success').scrollIntoView({behavior:'smooth'}); $('request-reference').tabIndex=-1; $('request-reference').focus({preventScroll:true});
  }
  async function checkStatus(repeat=true) {
    $('check-status').hidden=true; $('submit').hidden=true;
    for (let i=0;i<(repeat?30:1);i++) {
      const result=await api(`/applications/${requestId}`,undefined,'GET');
      if (result.status==='RECEIVED' || (demo && result.status==='DEMO_COMPLETE')) { finish(result); return; }
      if (result.status==='NEEDS_CORRECTION') {
        progress(''); lockFiles(false); $('submit').hidden=false; $('submit').textContent='Reemplazar y reenviar';
        throw new Error(`Reemplaza el documento que no superó la revisión: ${config.files[result.issue?.kind]?.label || 'documento adjunto'}.`);
      }
      if (result.status==='ERROR') { $('submit').hidden=false; $('submit').textContent='Reintentar procesamiento'; throw new Error('No se pudo completar el procesamiento. Puedes reintentarlo con el mismo número de solicitud.'); }
      progress(`Estamos verificando y guardando tus documentos. Solicitud: ${requestId}`);
      if(repeat) await new Promise(resolve=>setTimeout(resolve,2000));
    }
    progress(`Tu solicitud continúa en procesamiento. Número: ${requestId}. Mantén esta página abierta para consultar el resultado.`); $('check-status').hidden=false;
  }
  $('registration').addEventListener('submit', async e => {
    e.preventDefault(); if(busy) return;
    if(!requestId && (!validStep(1)||!validStep(2))) return;
    for (const kind of Object.keys(config.files)) if (!$(kind).reportValidity()) return;
    busy=true; message(''); $('submit').disabled=true; $('check-status').hidden=true;
    try {
      if(!requestId) { const result=await api('/applications',{sessionId:session.id,data:readData()}); requestId=result.id; }
      lockData(true);
      const current=await api(`/applications/${requestId}`,undefined,'GET');
      if(current.status==='RECEIVED' || (demo && current.status==='DEMO_COMPLETE')) return finish(current);
      if(['DRAFT','NEEDS_CORRECTION'].includes(current.status)) {
        let done=0; const chosen=Object.keys(config.files).filter(k=>$(k).files[0]);
        lockFiles(true);
        for(const kind of chosen) { progress(`${demo?'Comprobando selección':'Guardando documento'} ${++done} de ${chosen.length}: ${config.files[kind].label}`); const form=new FormData(); form.append('file',$(kind).files[0]); await api(`/applications/${requestId}/files/${kind}`,form,'PUT'); }
      }
      await api(`/applications/${requestId}/finalize`,{}); await checkStatus();
    } catch(e) {
      message(e.message);
      if(!completed) {
        $('submit').hidden=false; $('submit').textContent='Reintentar envío';
        if(requestId) {
          try { const current=await api(`/applications/${requestId}`,undefined,'GET'); if(['DRAFT','NEEDS_CORRECTION'].includes(current.status)) lockFiles(false); } catch {}
        }
      }
    }
    finally { busy=false; $('submit').disabled=false; }
  });
  $('check-status').addEventListener('click', async () => { if(busy) return; busy=true; message(''); try{await checkStatus();}catch(e){message(e.message);$('check-status').hidden=false;}finally{busy=false;} });
  window.addEventListener('beforeunload', e => { if(dirty&&!completed){e.preventDefault();e.returnValue='';} });
  (async()=>{
    try { config=await api('/config',undefined,'GET'); renderFiles(); if(!demo)await loadCaptcha(); $('start').disabled=false; $('start').textContent=demo?'Probar formulario':'Comenzar registro';
      if(demo){ $('mode-banner').hidden=false; $('mode-banner').textContent='DEMOSTRACIÓN · Solo datos y documentos ficticios. No se envían correos ni se guardan solicitudes.'; $('send-code').textContent='Mostrar código de prueba'; $('code-help').textContent='Usa el código simulado que aparece abajo. No se enviará ningún correo.'; $('verified').textContent='Verificación simulada completada'; }
      if(config.mode==='local'){ $('mode-banner').hidden=false; $('mode-banner').textContent='Prueba local · Usa datos ficticios. Los correos y Drive están simulados; no se envía información a Google.'; }
    } catch { $('start').textContent='Servicio no disponible'; $('service-error').hidden=false; $('service-error').textContent=demo?'No se pudo cargar la demostración. Recarga la página para intentar de nuevo.':'El registro no está disponible en este momento. Intenta de nuevo más tarde.'; }
  })();
})();
