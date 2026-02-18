import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SavedForm {
  id: string;
  name: string;
  snippet: string;
  createdAt: string;
}

export function useSavedForms() {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(async () => {
    const { data, error } = await supabase
      .from("saved_forms")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setForms(
        data.map((row: any) => ({
          id: row.id,
          name: row.name,
          snippet: row.snippet,
          createdAt: row.created_at,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const addForm = useCallback(async (name: string, snippet: string) => {
    const trimmedName = name.trim() || `Formulario ${Date.now()}`;
    const { data, error } = await supabase
      .from("saved_forms")
      .insert({ name: trimmedName, snippet })
      .select()
      .single();

    if (!error && data) {
      const newForm: SavedForm = {
        id: data.id,
        name: data.name,
        snippet: data.snippet,
        createdAt: data.created_at,
      };
      setForms((prev) => [newForm, ...prev]);
      return newForm;
    }
    return null;
  }, []);

  const removeForm = useCallback(async (id: string) => {
    const { error } = await supabase.from("saved_forms").delete().eq("id", id);
    if (!error) {
      setForms((prev) => prev.filter((f) => f.id !== id));
    }
  }, []);

  const refreshForm = useCallback(async (id: string): Promise<SavedForm | null> => {
    const { data, error } = await supabase
      .from("saved_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      const refreshed: SavedForm = {
        id: data.id,
        name: data.name,
        snippet: data.snippet,
        createdAt: data.created_at,
      };
      setForms((prev) =>
        prev.map((f) => (f.id === refreshed.id ? refreshed : f))
      );
      return refreshed;
    }
    return null;
  }, []);

  return { forms, addForm, removeForm, refreshForm, loading };
}
