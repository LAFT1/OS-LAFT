-- Execute este script no Supabase: seu projeto > SQL Editor > New query > colar > Run.
-- Ele cria a tabela que guarda os dados do app (empresa configurada e cada OS)
-- e as regras de acesso (só usuários logados podem ler/gravar).

create table if not exists kv_store (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table kv_store enable row level security;

-- Qualquer usuário autenticado (com login válido) pode ler tudo.
create policy "authenticated can read kv_store"
  on kv_store for select
  to authenticated
  using (true);

-- Qualquer usuário autenticado pode criar/atualizar registros.
create policy "authenticated can write kv_store"
  on kv_store for insert
  to authenticated
  with check (true);

create policy "authenticated can update kv_store"
  on kv_store for update
  to authenticated
  using (true);

-- Qualquer usuário autenticado pode excluir uma OS.
create policy "authenticated can delete kv_store"
  on kv_store for delete
  to authenticated
  using (true);
