# Nexa Academy — Incremento 12: autenticação do portal (base real)

## Entregue
- Interface responsiva e formulário de login usando Supabase Auth (`signInWithPassword`).
- Validação da sessão com `getUser`, atualização de estado e logout.
- Falha fechada sem configuração; nenhuma aula/questão é exposta.
- Não lê tabelas administrativas nem gabaritos e não permite pagamentos.

## Configuração
1. Preencher `config.js` com URL do projeto e chave **publishable** pública, nunca `service_role`.
2. Servir a pasta em HTTPS ou com servidor estático local; módulos ES não funcionam confiavelmente em `file://`.
3. Criar conta de aluno via fluxo autorizado no Supabase Auth (este pacote não cria contas nem matrículas).
4. Verificar login/logout com conta de teste e testar em iPhone.

## Não entregue / bloqueios
- Este é um **núcleo de autenticação**, não um portal de cursos completo.
- Não há catálogo de cursos liberados: o banco consultado não tem cursos publicados.
- Matrículas, progresso, correção, certificados e pagamentos exigem migração, políticas RLS, APIs seguras e testes adicionais.
- MP4 existentes ainda precisam ser verificados no Storage e revisados editorialmente.
- Não foi instalado no Supabase nem publicado; não há cobrança habilitada.

## Testes estáticos
`node --check app.js` (ou `node --check` em cópia `.mjs`), inspecionar `config.js` para ausência de segredos, e verificar que nenhuma tabela `studio_*` é consultada.
