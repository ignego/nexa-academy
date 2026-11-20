import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
const $ = (id) => document.getElementById(id);
const cfg = window.NEXA_PUBLIC_CONFIG || {};
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl || '') && typeof cfg.supabasePublishableKey === 'string' && cfg.supabasePublishableKey.length > 20;
let client = null;
function render(user) {
  $('login').hidden = !!user;
  $('logged').hidden = !user;
  $('catalog').hidden = !user;
  $('account').textContent = user ? `Conectado como ${user.email || 'aluno'}` : '';
  $('status').textContent = user ? 'Conta autenticada. Cursos ainda não liberados.' : 'Entre com sua conta para acompanhar a disponibilidade dos cursos.';
}
if (!configured) {
  $('status').textContent = 'Portal ainda não configurado. Preencha config.js somente com as credenciais públicas do projeto.';
} else {
  client = createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
  client.auth.getUser().then(({data,error}) => { if(error) $('status').textContent='Não foi possível validar a sessão.'; render(data?.user ?? null); }).catch(() => {$('status').textContent='Falha na conexão com a autenticação.';});
  client.auth.onAuthStateChange((_event, session) => render(session?.user ?? null));
}
$('login').addEventListener('submit', async e => {
  e.preventDefault();
  if (!client) return;
  const button = $('login').querySelector('button'); button.disabled = true;
  $('status').textContent = 'Autenticando…';
  try {
    const {error} = await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    if(error) $('status').textContent = 'Não foi possível entrar. Confira as credenciais.';
  } catch { $('status').textContent='Erro de conexão. Tente novamente.'; }
  finally {button.disabled=false;$('password').value='';}
});
$('logout').addEventListener('click',async()=>{if(client) await client.auth.signOut();});
// Importante: não há SELECT nas tabelas studio_* nem exibição de questões/gabaritos.
// O catálogo de alunos deverá usar uma API com publicação, matrícula e RLS verificadas.
