import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from "lucide-react";

type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function getOAuth(): OAuthNs | null {
  const anyAuth = (supabase.auth as any).oauth;
  return anyAuth ?? null;
}

function safeNext(): string {
  const path = window.location.pathname + window.location.search;
  return path.startsWith("/") ? path : "/";
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("authorization_id ausente na URL.");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        window.location.href = "/login?next=" + encodeURIComponent(safeNext());
        return;
      }
      const oauth = getOAuth();
      if (!oauth) {
        setError("Servidor de autorização OAuth não está habilitado neste projeto.");
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    const oauth = getOAuth();
    if (!oauth) return;
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("O servidor de autorização não retornou uma URL de redirecionamento.");
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Monitor className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciador Online</h1>
          <p className="text-muted-foreground mt-2">Autorização de acesso</p>
        </div>
        <Card className="shadow-elegant border-border bg-gradient-card">
          <CardHeader>
            <CardTitle>Conectar aplicativo</CardTitle>
            <CardDescription>
              {details?.client?.name
                ? `${details.client.name} está solicitando acesso à sua conta.`
                : "Um aplicativo está solicitando acesso à sua conta."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!error && !details && <p className="text-sm text-muted-foreground">Carregando…</p>}
            {details && (
              <>
                <p className="text-sm text-muted-foreground">
                  Ao aprovar, o aplicativo poderá acessar as ferramentas do Gerenciador Online em seu nome.
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                    Aprovar
                  </Button>
                  <Button
                    className="flex-1"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => decide(false)}
                  >
                    Negar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
