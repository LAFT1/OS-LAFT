import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { supabase } from "./supabaseClient";
import { installStorageShim } from "./storageShim";
import Login from "./Login";
import App from "./App";

installStorageShim();

function Root() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Carregando...</div>
    );
  }
  if (!session) return <Login />;
  return <App onLogout={() => supabase.auth.signOut()} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
