import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("SQL migration keeps concurrent duplicate webhook IDs immutable and private, and bounds the receipt bucket", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema storage;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated;
      grant select on storage.objects to authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql as $$ select current_setting('request.jwt.claim.sub', true)::uuid $$;
      create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/') $$;
    `);
    const directory = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
    const filename = (await readdir(directory)).find((name) => name.endsWith("_privileged_api_boundaries.sql"));
    expect(filename).toBeDefined();
    await db.exec(await readFile(`${directory}/${filename}`, "utf8"));
    await Promise.all(["original", "replayed"].map((value) => db.query(
      "insert into public.subscription_events (id, event_type, payload) values ('event-1', 'TEST', $1::jsonb) on conflict (id) do nothing", [JSON.stringify({ value })],
    )));
    expect((await db.query("select payload from public.subscription_events")).rows).toEqual([{ payload: { value: "original" } }]);
    expect((await db.query("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'receipts'")).rows).toEqual([
      { public: false, file_size_limit: 10485760, allowed_mime_types: ["image/jpeg", "image/png", "application/pdf"] },
    ]);
    await db.exec(`insert into storage.objects values
      ('receipts', '11111111-1111-4111-8111-111111111111/transaction/own.png'),
      ('receipts', '22222222-2222-4222-8222-222222222222/transaction/foreign.png'),
      ('elsewhere', '11111111-1111-4111-8111-111111111111/transaction/other.png');
      select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);`);
    await db.exec("set role authenticated");
    expect((await db.query("select name from storage.objects")).rows).toEqual([
      { name: "11111111-1111-4111-8111-111111111111/transaction/own.png" },
    ]);
    await expect(db.query("select * from public.subscription_events")).rejects.toThrow(/permission denied/);
    await expect(db.query("insert into public.subscription_events (id, event_type, payload) values ('forged', 'TEST', '{}')")).rejects.toThrow(/permission denied/);
  } finally { await db.close(); }
});

it("service_role can select receipt ownership while public roles gain no transaction access", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql as $$ select current_setting('request.jwt.claim.sub', true)::uuid $$;
      create table public.financial_transactions (id uuid primary key, user_id uuid not null);
      alter table public.financial_transactions enable row level security;
      grant select, insert, update, delete on public.financial_transactions to authenticated;
      create policy "transactions owner" on public.financial_transactions for all to authenticated
        using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
      insert into public.financial_transactions values
        ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111'),
        ('44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333');
    `);
    const directory = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
    const filename = (await readdir(directory)).find((name) => name.endsWith("_receipt_signer_lookup_grant.sql"));
    // Before the additive migration exists, exercise the original deployment privileges.
    if (filename) await db.exec(await readFile(`${directory}/${filename}`, "utf8"));
    await db.exec("set role service_role");
    expect((await db.query(`select id from public.financial_transactions
      where id = '22222222-2222-4222-8222-222222222222'
      and user_id = '11111111-1111-4111-8111-111111111111'`)).rows).toEqual([
      { id: "22222222-2222-4222-8222-222222222222" },
    ]);
    expect((await db.query(`select id from public.financial_transactions
      where id = '44444444-4444-4444-8444-444444444444'
      and user_id = '11111111-1111-4111-8111-111111111111'`)).rows).toEqual([]);
    await expect(db.query("delete from public.financial_transactions")).rejects.toThrow(/permission denied/);
    await db.exec("reset role; set role anon");
    await expect(db.query("select id from public.financial_transactions")).rejects.toThrow(/permission denied/);
    await db.exec(`reset role;
      select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
      set role authenticated;`);
    expect((await db.query("select id from public.financial_transactions")).rows).toEqual([
      { id: "22222222-2222-4222-8222-222222222222" },
    ]);
  } finally { await db.close(); }
}, 15000);
