"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useActionState, useEffect, useRef, type ReactNode } from "react";

import { Button } from "@vanta/ui/components/button";
import { Input } from "@vanta/ui/components/input";
import { Label } from "@vanta/ui/components/label";
import { Textarea } from "@vanta/ui/components/textarea";

import { submitInternalAppIdea } from "./actions";
import {
  initialIdeaSubmissionState,
  type IdeaSubmissionField,
} from "./idea-submission-state";

type FieldControlProps = {
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  id: IdeaSubmissionField;
  name: IdeaSubmissionField;
};

export function IdeaSubmissionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    submitInternalAppIdea,
    initialIdeaSubmissionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status, state.submittedAt]);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
      ref={formRef}
    >
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold">Submit an app idea</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          New ideas are recorded for review in the internal app intake sheet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          error={state.fieldErrors.appName}
          label="App name"
          name="appName"
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              disabled={isPending}
              maxLength={80}
              placeholder="Compliance task tracker"
              required
              type="text"
            />
          )}
        </FormField>

        <FormField
          error={state.fieldErrors.submitterEmail}
          label="Submitter email"
          name="submitterEmail"
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              disabled={isPending}
              maxLength={254}
              placeholder="you@vanta.com"
              required
              type="email"
            />
          )}
        </FormField>
      </div>

      <FormField
        error={state.fieldErrors.description}
        label="Description"
        name="description"
      >
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            className="min-h-28 resize-y"
            disabled={isPending}
            maxLength={1000}
            placeholder="What should this app help people do?"
            required
          />
        )}
      </FormField>

      <FormField
        error={state.fieldErrors.accessNeeded}
        label="Access needed"
        name="accessNeeded"
      >
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            disabled={isPending}
            maxLength={500}
            placeholder="Systems, teams, or data the app needs access to"
            required
          />
        )}
      </FormField>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubmissionMessage message={state.message} status={state.status} />
        <Button className="sm:w-auto" disabled={isPending} type="submit">
          {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {isPending ? "Submitting" : "Submit idea"}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  children,
  error,
  label,
  name,
}: {
  children: (props: FieldControlProps) => ReactNode;
  error?: string;
  label: string;
  name: IdeaSubmissionField;
}) {
  const errorId = `${name}-error`;
  const controlProps: FieldControlProps = {
    id: name,
    name,
  };

  if (error) {
    controlProps["aria-describedby"] = errorId;
    controlProps["aria-invalid"] = true;
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children(controlProps)}
      {error ? (
        <span className="text-xs font-medium text-destructive" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function SubmissionMessage({
  message,
  status,
}: {
  message: string;
  status: "idle" | "success" | "error";
}) {
  if (!message) {
    return <span className="min-h-5 text-sm text-muted-foreground" />;
  }

  return (
    <p
      className={
        status === "success"
          ? "text-sm font-medium text-primary"
          : "text-sm font-medium text-destructive"
      }
    >
      {message}
    </p>
  );
}
