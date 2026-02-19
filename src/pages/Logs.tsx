import { motion } from "framer-motion";
import { Trash2, Terminal, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogs, LogEntry } from "@/contexts/LogsContext";
import { cn } from "@/lib/utils";

const levelConfig: Record<LogEntry["level"], { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-info" },
  success: { icon: CheckCircle, className: "text-success" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  error: { icon: XCircle, className: "text-destructive" },
};

export default function Logs() {
  const { logs, clearLogs } = useLogs();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs Técnicos</h1>
          <p className="text-sm text-muted-foreground">Eventos de carga y ejecución de formularios</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearLogs} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Limpiar
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Terminal className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin eventos registrados</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {logs.map((log, i) => {
              const config = levelConfig[log.level];
              const Icon = config.icon;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 border-b border-border/50 px-5 py-3 last:border-0"
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.className)} />
                  <div className="min-w-0 flex-1">
                    <p className="break-all font-mono text-xs text-foreground">{log.message}</p>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <span>{log.timestamp.toLocaleTimeString("es-AR", { hour12: false })}</span>
                      {log.formName && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {log.formName}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
