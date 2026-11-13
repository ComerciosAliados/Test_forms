// Solo para la demostración estática. No hace llamadas de red ni persiste datos.
// El backend real no carga este archivo y conserva todas sus comprobaciones.
(() => {
  'use strict';
  if (window.CMF_REGISTRATION_CONFIG?.mode !== 'demo') return;
  const spec = window.CMF_DEMO_SPEC;
  const sessions = new Map(), applications = new Map();
  const code = '123456';
  const status = a => ({ id:a.id, status:a.status, mailStatus:'SIMULATED', uploaded:Object.keys(a.files) });
  function getSession(id, auth) {
    const s=sessions.get(id);
    if(!s || auth?.id!==id || auth?.token!==s.token)throw new Error('Reinicia esta demostración verificando el correo.');
    return s;
  }
  window.CMF_DEMO_API = async (route, body, method, auth) => {
    if(route==='/config' && method==='GET')return { mode:'demo', siteKey:'', ...spec };
    if(route==='/sessions' && method==='POST'){
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))throw new Error('Escribe un correo de ejemplo válido.');
      const id=crypto.randomUUID(),token=crypto.randomUUID();sessions.set(id,{id,token,verified:false});
      return {id,token,testCode:code};
    }
    const sRoute=/^\/sessions\/([^/]+)\/(verify|resend)$/.exec(route);
    if(sRoute && method==='POST'){
      const s=getSession(sRoute[1],auth);
      if(sRoute[2]==='resend')return {ok:true,testCode:code};
      if(body.code!==code)throw new Error('Usa el código de demostración que aparece en pantalla.');
      s.verified=true;return {verified:true};
    }
    if(route==='/applications' && method==='POST'){
      const s=getSession(body.sessionId,auth);
      if(!s.verified)throw new Error('Completa la verificación simulada del correo.');
      if(!body.data?.consentimiento)throw new Error('Confirma que estás usando datos ficticios.');
      const id='DEMO-'+s.id;
      if(!applications.has(id))applications.set(id,{id,sessionId:s.id,status:'DRAFT',files:{}});
      return status(applications.get(id));
    }
    const aRoute=/^\/applications\/([^/]+)(?:\/(finalize|files\/([^/]+)))?$/.exec(route);
    if(aRoute){
      const a=applications.get(aRoute[1]);
      if(!a)throw new Error('Esta prueba ya no está disponible. Recarga la página.');
      getSession(a.sessionId,auth);
      if(!aRoute[2] && method==='GET')return status(a);
      if(aRoute[3] && method==='PUT'){
        if(a.status!=='DRAFT')throw new Error('Esta demostración ya terminó.');
        const kind=aRoute[3],file=body.get('file');
        if(!spec.files[kind] || !file?.size || file.size>spec.maxFileBytes || !/\.(pdf|jpe?g|png)$/i.test(file.name))throw new Error('Selecciona un archivo ficticio PDF, JPG o PNG de hasta 5 MB.');
        // Solo recordar que se seleccionó un documento: no leer ni almacenar su contenido.
        a.files[kind]=true;return {uploaded:kind};
      }
      if(aRoute[2]==='finalize' && method==='POST'){
        if(Object.entries(spec.files).some(([k,f])=>f.required&&!a.files[k]))throw new Error('Selecciona los documentos de prueba obligatorios.');
        a.status='DEMO_COMPLETE';return status(a);
      }
    }
    throw new Error('Operación no disponible en esta demostración.');
  };
})();
