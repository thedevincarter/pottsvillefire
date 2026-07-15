declare module "netlify-identity-widget" {
  interface User {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
    token: {
      access_token: string;
      expires_at: number;
      expires_in: number;
      refresh_token: string;
      token_type: string;
    };
  }

  type EventType = "init" | "login" | "logout" | "error" | "open" | "close";

  function init(opts?: { APIUrl?: string; logo?: boolean }): void;
  function open(tabName?: "login" | "signup"): void;
  function close(): void;
  function logout(): Promise<void>;
  function currentUser(): User | null;
  function on(event: EventType, callback: (user?: User) => void): void;
  function off(event: EventType, callback?: (user?: User) => void): void;
}
