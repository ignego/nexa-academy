import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const respond=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return respond({error:'Método inválido'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL')!, key=Deno.env.get('SUPABASE_ANON_KEY')!,secret=Deno.env.get('OPENAI_API_KEY');
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');if(!token)return respond({error:'Autenticação necessária'},401);
  const client=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:{user},error:ue}=await client.auth.getUser(token);if(ue||!user)return respond({error:'Sessão inválida'},401);
  const {data:admin}=await client.from('studio_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(!admin)return respond({error:'Acesso negado'},403);
  const {courseId,moduleId,topic,format,duration}=await req.json();
  if(typeof topic!=='string'||topic.length<5||topic.length>180||!['mixed','screen','animation'].includes(format)||!Number.isInteger(duration)||duration<5||duration>60)return respond({error:'Dados inválidos'},400);
  const {data:module}=await client.from('studio_modules').select('id,course_id').eq('id',moduleId).eq('course_id',courseId).maybeSingle();if(!module)return respond({error:'Módulo inválido'},400);
  const {data:course}=await client.from('studio_courses').select('title').eq('id',courseId).single();
  const {data:existing}=await client.from('studio_lessons').select('position').eq('module_id',moduleId);if((existing?.length||0)>=10)return respond({error:'Módulo já possui dez aulas'},409);
  if(!secret)return respond({error:'Configure OPENAI_API_KEY nos segredos da Edge Function'},503);
  const prompt=`Crie conteúdo educacional em português brasileiro para curso ${course.title}, assunto ${topic}, duração ${duration} minutos, formato ${format}, sem áudio. Responda APENAS JSON válido com: {"title":string,"scenes":[{"start_seconds":number,"end_seconds":number,"type":"screen"|"animation","visual":string,"caption":string,"instructions":string}],"activities":[{"question":string,"options":[string,string,string,string],"answer_index":number,"explanation":string}]}. Exatamente 10 atividades, cenas cobrindo sem lacunas o tempo inteiro, textos corretos, didáticos e específicos. Não afirme ter gerado vídeo.`;
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({model:Deno.env.get('OPENAI_MODEL')||'gpt-4o-mini',temperature:0.4,response_format:{type:'json_object'},messages:[{role:'system',content:'Você é um designer instrucional especializado. Gere somente JSON válido.'},{role:'user',content:prompt}]})});
  if(!r.ok)return respond({error:'Falha no serviço de IA',detail:(await r.text()).slice(0,200)},502);
  const output=JSON.parse((await r.json()).choices[0].message.content);
  if(!Array.isArray(output.scenes)||output.scenes.length<2||!Array.isArray(output.activities)||output.activities.length!==10)return respond({error:'A IA retornou conteúdo incompleto. Tente novamente.'},502);
  const valid=output.activities.every((a:any)=>typeof a.question==='string'&&Array.isArray(a.options)&&a.options.length===4&&Number.isInteger(a.answer_index)&&a.answer_index>=0&&a.answer_index<4&&typeof a.explanation==='string');if(!valid)return respond({error:'Questões inválidas retornadas pela IA'},502);
  const position=Math.max(0,...(existing||[]).map((x:any)=>x.position))+1;
  const {data:lesson,error:le}=await client.from('studio_lessons').insert({module_id:moduleId,position,title:String(output.title||topic).slice(0,150),topic,format,duration_minutes:duration,script:output.scenes,reviewed:false}).select().single();if(le)return respond({error:le.message},400);
  const {error:ae}=await client.from('studio_activities').insert(output.activities.map((a:any,i:number)=>({lesson_id:lesson.id,position:i+1,question:a.question,options:a.options,answer_index:a.answer_index,explanation:a.explanation})));
  if(ae){await client.from('studio_lessons').delete().eq('id',lesson.id);return respond({error:ae.message},400)}
  return respond({lesson});
 }catch(e){return respond({error:e instanceof Error?e.message:'Erro inesperado'},500)}
});
