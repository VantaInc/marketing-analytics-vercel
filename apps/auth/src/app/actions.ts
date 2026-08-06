"use server";

import { getCentralAuthSession, registerAuthClient } from "@/lib/auth";

export type RegisterClientState = {
  clientId?: string;
  clientSecret?: string;
  error?: string;
  redirectUris?: string[];
};

export async function registerClientAction(
  _previousState: RegisterClientState,
  formData: FormData,
): Promise<RegisterClientState> {
  try {
    const session = await getCentralAuthSession();

    if (!session) {
      return {
        error: "Sign in before registering an auth client.",
      };
    }

    const id = readFormValue(formData, "clientId");
    const name = readFormValue(formData, "name");
    const redirectUris = readFormValue(formData, "redirectUris")
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (redirectUris.length === 0) {
      return {
        error: "At least one redirect URI is required.",
      };
    }

    const registration = await registerAuthClient({
      id,
      name,
      redirectUris,
      user: session.user,
    });

    return {
      clientId: registration.client.id,
      clientSecret: registration.clientSecret,
      redirectUris: registration.client.redirectUris,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Auth client registration failed.",
    };
  }
}

function readFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
