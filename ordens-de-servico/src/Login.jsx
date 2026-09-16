import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("E-mail ou senha inválidos.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Ordens de Serviço</h1>
        <p className="text-sm text-slate-500 mb-5">Entre com a conta fornecida pela sua empresa.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
        <input
          type="email"
          required
          autoComplete="email"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-xs font-semibold text-slate-600 mb-1">Senha</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white text-sm font-semibold rounded-md py-2 hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-xs text-slate-400 mt-4">
          Não tem uma conta? Peça ao administrador para te convidar pelo painel do Supabase.
        </p>
      </form>
    </div>
  );
}
