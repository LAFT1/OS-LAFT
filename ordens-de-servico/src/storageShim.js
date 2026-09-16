import { supabase } from "./supabaseClient";

/**
 * This file recreates the same window.storage.get/set/delete/list API that the
 * app was originally built against inside Claude — but backed by a real
 * Supabase table ("kv_store") instead of Claude's artifact storage.
 *
 * Because of this, none of the app's own code (App.jsx) needed to change to
 * talk to Supabase — it just keeps calling window.storage.get/set/... as before.
 *
 * Note: every call in this app uses shared=true (there is no private/personal
 * data), so this shim treats the whole table as shared among all logged-in
 * users. If you ever add shared=false calls, you'll want to also store an
 * "owner" column and filter by the current user for those.
 */

async function get(key) {
  const { data, error } = await supabase.from("kv_store").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`key not found: ${key}`);
  return { key, value: data.value, shared: true };
}

async function set(key, value) {
  const { error } = await supabase.from("kv_store").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  return { key, value, shared: true };
}

async function del(key) {
  const { error } = await supabase.from("kv_store").delete().eq("key", key);
  if (error) throw error;
  return { key, deleted: true, shared: true };
}

async function list(prefix) {
  let query = supabase.from("kv_store").select("key");
  if (prefix) query = query.like("key", `${prefix}%`);
  const { data, error } = await query;
  if (error) throw error;
  return { keys: (data || []).map((row) => row.key), prefix, shared: true };
}

export function installStorageShim() {
  window.storage = { get, set, delete: del, list };
}
