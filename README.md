# Nexa AI Studio — versão integrada ao Supabase

Painel administrativo para **criar, organizar, revisar e controlar a publicação** de cursos. O pacote contém frontend estático, SQL de banco com RLS, bucket privado de vídeos e Edge Function para geração de roteiros e atividades com IA.

## O que funciona depois de configurar

- Login por e-mail/senha do Supabase Auth; só usuário cadastrado em `studio_admins` entra.
- Cursos com 9 módulos automáticos; até 10 aulas por módulo.
- Gerador de roteiros em cenas e **10 questões** com IA (exige chave externa, pode gerar custos).
- Editor manual de aulas, cenas JSON e atividades, marcação de revisão, upload de MP4, link temporário para assistir.
- Bloqueio de publicação até 9 módulos × 10 aulas × 10 atividades, vídeos e revisão concluídos.
- Exportação JSON para backup e interface responsiva.

## Instalação no Supabase (um projeto novo)

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. No **SQL Editor**, execute o conteúdo de `supabase/migrations/202611190001_initial.sql` uma vez. Isso cria tabelas, políticas RLS e bucket privado.
3. Em **Authentication > Users**, crie seu usuário com e-mail/senha (ou crie pelo fluxo administrativo). Copie o UUID do usuário.
4. No **SQL Editor**, execute: `insert into public.studio_admins(user_id) values ('SEU-UUID-AQUI');`. **Nunca use e-mail como ID** e não conceda admin a todos.
5. Em **Project Settings > API Keys**, copie a URL do projeto e a chave **publishable** (ou anon legada) para `config.js`. **Jamais use secret/service_role no navegador.**
6. Configure um segredo da Edge Function chamado `OPENAI_API_KEY` no painel do Supabase. Opcionalmente `OPENAI_MODEL`. Essa chave não pode estar no frontend.
7. Implante a função em `supabase/functions/generate-lesson/index.ts` usando o CLI do Supabase ou o editor de funções. Mantenha a verificação JWT ativada. Se usar CLI, consulte `supabase functions --help` e `supabase functions deploy --help` na sua versão antes de executar.
8. Hospede `index.html`, `app.js`, `styles.css` e `config.js` juntos em uma hospedagem estática HTTPS (Render Static Site, GitHub Pages, Netlify etc.). **Supabase não hospeda automaticamente este frontend** apenas ao importar o SQL.
9. Faça login e crie seu primeiro curso. Teste primeiro a geração de uma aula, revisão, atividades e upload de um MP4 curto.

## Limites importantes

- **Não gera vídeos MP4 automaticamente.** O gerador produz roteiro e atividades. Renderização de vídeos, demonstrações reais do Excel, apostilas PDF, cobrança, certificados de alunos e portal público são módulos separados, ainda não implementados neste pacote.
- A geração por IA depende de um provedor externo, pode gerar erros e custos, e requer revisão humana.
- O curso só pode ser publicado quando todas as 90 aulas tiverem vídeo, revisão e 10 atividades. O status é administrativo; o catálogo público de alunos ainda não está incluído.
- O upload direto do navegador é limitado a 500 MB por arquivo. Para vídeos grandes, considere uploads resumíveis e streaming dedicado.
- A exportação JSON é um backup de conteúdo, não de vídeos; guarde os MP4 separadamente.
- A função usa `SUPABASE_ANON_KEY`, disponível por compatibilidade em projetos Supabase; caso seu ambiente só exponha chaves novas, adapte a inicialização para `SUPABASE_PUBLISHABLE_KEYS`.

## Segurança

- Todas as tabelas de conteúdo possuem RLS. Só a conta em `studio_admins` pode acessar.
- `studio_admins` não permite autoinscrição. A inserção do primeiro administrador é manual e privilegiada.
- O bucket de vídeos é privado e utiliza URLs assinadas temporárias.
- Nunca publique `OPENAI_API_KEY`, chaves secretas ou credenciais de banco em GitHub ou `config.js`.
- Antes de operar comercialmente, valide autenticação, políticas, backups, custos, limites de upload e monitoramento no seu projeto real.

## Testes sugeridos

1. Usuário sem `studio_admins` deve ser rejeitado.
2. Admin cria curso e recebe nove módulos.
3. Admin cria uma aula manual, adiciona dez atividades e salva roteiro.
4. Gerador retorna dez questões e cenas quando segredo e função estiverem configurados.
5. Curso incompleto não pode ser publicado.
6. Upload MP4 e link temporário funcionam no bucket privado.
7. Conta não autorizada não pode ler tabelas nem vídeos.

## Organização

`index.html` / `styles.css` / `app.js` — interface web

`config.js` — configuração pública de conexão (preencher)

`supabase/migrations/202611190001_initial.sql` — banco, RLS e storage

`supabase/functions/generate-lesson/index.ts` — função de IA protegida
