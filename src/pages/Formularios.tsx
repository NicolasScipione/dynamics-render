import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Play, Code2, X, Archive, Clock, FileText, RefreshCw, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogs } from "@/contexts/LogsContext";
import { useSavedForms, SavedForm } from "@/hooks/useSavedForms";

export default function Formularios() {
  const [snippet, setSnippet] = useState("");
  const [formName, setFormName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { addLog } = useLogs();
  const { forms, addForm, removeForm, refreshForm, updateFormName } = useSavedForms();

  const renderSnippet = useCallback((snippetContent: string) => {
    if (!snippetContent.trim() || !containerRef.current) return;

    containerRef.current.innerHTML = "";
    setLoaded(false);

    try {
      const temp = document.createElement("div");
      temp.innerHTML = snippetContent;

      const scripts = temp.querySelectorAll("script");
      const scriptSources: { src?: string; inline?: string }[] = [];

      scripts.forEach((s) => {
        if (s.src) {
          scriptSources.push({ src: s.src });
        } else if (s.textContent) {
          scriptSources.push({ inline: s.textContent });
        }
        s.remove();
      });

      containerRef.current.innerHTML = temp.innerHTML;
      addLog("info", "HTML del formulario insertado correctamente");

      const executeScripts = async () => {
        for (const script of scriptSources) {
          try {
            if (script.src) {
              await new Promise<void>((resolve, reject) => {
                const el = document.createElement("script");
                el.src = script.src!;
                el.async = true;
                el.onload = () => {
                  addLog("success", `Script cargado: ${script.src}`);
                  resolve();
                };
                el.onerror = () => {
                  addLog("error", `Error cargando script: ${script.src}`);
                  reject(new Error(`Failed to load: ${script.src}`));
                };
                document.body.appendChild(el);
              });
            } else if (script.inline) {
              const el = document.createElement("script");
              el.textContent = script.inline;
              document.body.appendChild(el);
              addLog("success", "Script inline ejecutado");
            }
          } catch (err: any) {
            addLog("error", err.message);
          }
        }
      };

      executeScripts().then(() => {
        setLoaded(true);
        addLog("success", "Formulario renderizado completamente");
      });
    } catch (err: any) {
      addLog("error", `Error al procesar snippet: ${err.message}`);
    }
  }, [addLog]);

  const loadForm = useCallback(async () => {
    if (!snippet.trim()) return;
    const saved = await addForm(formName, snippet);
    if (saved) setActiveFormId(saved.id);
    renderSnippet(snippet);
    setShowInput(false);
    setSnippet("");
    setFormName("");
  }, [snippet, formName, addForm, renderSnippet]);

  const loadSavedForm = useCallback(async (form: SavedForm) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setActiveFormId(form.id);
    setReloading(true);

    const refreshed = await refreshForm(form.id);
    if (controller.signal.aborted) return;

    renderSnippet(refreshed ? refreshed.snippet : form.snippet);
    setReloading(false);
  }, [renderSnippet, refreshForm]);

  const handleReload = useCallback(async () => {
    if (!activeFormId) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setReloading(true);
    const refreshed = await refreshForm(activeFormId);
    if (controller.signal.aborted) return;

    if (refreshed) renderSnippet(refreshed.snippet);
    setReloading(false);
    addLog("info", "Datos del formulario recargados");
  }, [activeFormId, refreshForm, renderSnippet, addLog]);

  const deleteSavedForm = useCallback((id: string) => {
    removeForm(id);
    if (activeFormId === id) {
      if (containerRef.current) containerRef.current.innerHTML = "";
      setLoaded(false);
      setActiveFormId(null);
    }
    if (editingId === id) setEditingId(null);
    addLog("info", "Formulario eliminado del historial");
  }, [removeForm, activeFormId, editingId, addLog]);

  const startEditing = useCallback((form: SavedForm, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(form.id);
    setEditName(form.name);
  }, []);

  const saveEditing = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId) return;
    const ok = await updateFormName(editingId, editName);
    if (ok) addLog("info", "Nombre del formulario actualizado");
    setEditingId(null);
  }, [editingId, editName, updateFormName, addLog]);

  const clearForm = useCallback(() => {
    if (containerRef.current) containerRef.current.innerHTML = "";
    setSnippet("");
    setFormName("");
    setLoaded(false);
    setActiveFormId(null);
    addLog("info", "Formulario limpiado");
  }, [addLog]);

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Formularios</h1>
        <p className="text-sm text-muted-foreground">
          Cargá snippets de Dynamics 365 Customer Insights
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Saved Forms Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card flex flex-col p-4 lg:col-span-1"
        >
          <div className="mb-4 flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Guardados</h3>
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {forms.length}
            </span>
          </div>

          {forms.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <FileText className="h-8 w-8 opacity-30" />
              <p className="text-xs">Sin formularios guardados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
              {forms.map((form) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`group flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 cursor-pointer ${
                    activeFormId === form.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/20 hover:bg-secondary/50"
                  }`}
                  onClick={() => loadSavedForm(form)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === form.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing(e as any);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="w-full rounded border border-border bg-muted px-2 py-0.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    ) : (
                      <p className="truncate text-sm font-medium text-foreground">
                        {form.name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(form.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {editingId === form.id ? (
                    <button
                      onClick={saveEditing}
                      className="rounded-md p-1.5 text-primary transition-all hover:bg-primary/10"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => startEditing(form, e)}
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedForm(form.id);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card min-h-[400px] p-6 lg:col-span-2"
        >
          {!loaded && !showInput && !reloading && (
            <div className="flex h-[350px] flex-col items-center justify-center gap-4 text-muted-foreground">
              <Code2 className="h-12 w-12 opacity-40" />
              <p className="text-sm">Ningún formulario cargado</p>
              <p className="text-xs">Usá el botón + para pegar un snippet</p>
            </div>
          )}
          {reloading && (
            <div className="flex h-[350px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin opacity-40" />
              <p className="text-sm">Cargando formulario…</p>
            </div>
          )}
          {loaded && activeFormId && (
            <div className="mb-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                disabled={reloading}
                className="gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reloading ? "animate-spin" : ""}`} />
                Recargar datos
              </Button>
            </div>
          )}
          <div ref={containerRef} className="dynamics-form-container" />
        </motion.div>
      </div>

      {/* Snippet Input Modal */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowInput(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card mx-4 w-full max-w-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Pegar Snippet</h3>
                <button onClick={() => setShowInput(false)} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre del formulario (opcional)"
                className="mb-3 w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder={'<div data-form-id="..." ...></div>\n<script src="https://..."></script>'}
                className="h-56 w-full resize-none rounded-lg border border-border bg-muted p-4 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="mt-4 flex gap-3">
                <Button onClick={loadForm} disabled={!snippet.trim()} className="gap-2">
                  <Play className="h-4 w-4" />
                  Cargar y Guardar
                </Button>
                <Button onClick={clearForm} variant="outline" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowInput(true)}
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg glow-primary transition-shadow hover:shadow-xl"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
