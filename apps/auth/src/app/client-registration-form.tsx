"use client";

import { useActionState } from "react";
import { KeyRound, PlusCircle } from "lucide-react";
import { Badge } from "@vanta/ui/components/badge";
import { Button } from "@vanta/ui/components/button";
import { Input } from "@vanta/ui/components/input";
import { Label } from "@vanta/ui/components/label";
import { Textarea } from "@vanta/ui/components/textarea";

import { registerClientAction, type RegisterClientState } from "./actions";

const initialState: RegisterClientState = {};

export function ClientRegistrationForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, isPending] = useActionState(
    registerClientAction,
    initialState,
  );

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PlusCircle className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Register Client</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Submitting an existing id rotates its client secret.
          </p>
        </div>
        <Badge variant={disabled ? "outline" : "secondary"}>
          {disabled ? "Unavailable" : "Enabled"}
        </Badge>
      </div>

      <form action={formAction} className="mt-5 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            disabled={disabled || isPending}
            id="clientId"
            name="clientId"
            placeholder="slack-review-tool"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            disabled={disabled || isPending}
            id="name"
            name="name"
            placeholder="Slack Review Tool"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="redirectUris">Redirect URIs</Label>
          <Textarea
            disabled={disabled || isPending}
            id="redirectUris"
            name="redirectUris"
            placeholder={
              "http://localhost:3000/api/auth/callback\nhttps://slack-review-tool.vercel.app/api/auth/callback"
            }
            required
            rows={4}
          />
        </div>

        <Button
          className="w-fit"
          disabled={disabled || isPending}
          type="submit"
        >
          {isPending ? "Registering" : "Register client"}
          <KeyRound />
        </Button>
      </form>

      {state.error ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}

      {state.clientId && state.clientSecret ? (
        <div className="mt-5 rounded-lg border border-primary/40 bg-primary/10 p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Client Env Vars</h3>
          </div>
          <div className="mt-3 grid gap-2 font-mono text-xs text-foreground">
            <code>VANTA_AUTH_CLIENT_ID={state.clientId}</code>
            <code>VANTA_AUTH_CLIENT_SECRET={state.clientSecret}</code>
          </div>
        </div>
      ) : null}
    </section>
  );
}
