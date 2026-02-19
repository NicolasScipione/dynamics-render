import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LogEntry = {
  id: string;
  timestamp: Date;
  level: "info" | "success" | "error" | "warning";
  message: string;
  formId?: string | null;
  formName?: string | null;
};

type LogsContextType = {
  logs: LogEntry[];
  addLog: (level: LogEntry["level"], message: string, formId?: string | null, formName?: string | null) => void;
  clearLogs: () => void;
};

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Load persisted logs on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("form_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) {
        setLogs(
          data.map((row: any) => ({
            id: row.id,
            timestamp: new Date(row.created_at),
            level: row.level as LogEntry["level"],
            message: row.message,
            formId: row.form_id,
            formName: row.form_name,
          }))
        );
      }
    };
    load();
  }, []);

  const addLog = useCallback(
    (level: LogEntry["level"], message: string, formId?: string | null, formName?: string | null) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        level,
        message,
        formId: formId ?? null,
        formName: formName ?? null,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 200));

      // Persist to DB (fire-and-forget)
      supabase
        .from("form_logs")
        .insert({
          level,
          message,
          form_id: formId ?? null,
          form_name: formName ?? null,
        })
        .then();
    },
    []
  );

  const clearLogs = useCallback(async () => {
    setLogs([]);
    await supabase.from("form_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }, []);

  return (
    <LogsContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogsContext.Provider>
  );
};

export const useLogs = () => {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used within LogsProvider");
  return ctx;
};
