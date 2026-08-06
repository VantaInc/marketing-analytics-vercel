import { LogIn, LogOut } from "lucide-react";

import { Button } from "@vanta/ui/components/button";

export function SignInButton() {
  return (
    <Button asChild>
      <a href="/api/auth/authorize">
        <LogIn />
        Sign in
      </a>
    </Button>
  );
}

export function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <Button type="submit" variant="outline">
        <LogOut />
        Sign out
      </Button>
    </form>
  );
}
