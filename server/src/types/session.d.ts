import 'express-session';

// What we keep in the server-side session. Only IDs and the OAuth state, never GitHub tokens.
declare module 'express-session' {
  interface SessionData {
    userId: number;
    oauthState: string;
  }
}
