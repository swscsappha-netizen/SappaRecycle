# School Google verification

Status: Google provider enabled; database and frontend deployment in progress.

The points app requires LINE first, then Google authentication using five digits followed by `@sappha.ac.th`. The server verifies the Supabase session against `/auth/v1/user`, requires a verified Google identity, derives the student ID from its email, checks the roster, and refuses conflicting LINE or Google bindings. No password or Google secret belongs in frontend configuration.

## Required provider setup

Create a Google OAuth client of type Web application in a school-controlled Google Cloud project. Configure the consent screen with openid, email, and profile scopes. Use Internal audience if the school Workspace organization supports it, or configure the appropriate production audience.

- Authorized JavaScript origin: `https://recycle.swscofficial.com`
- Authorized redirect URI: `https://socuwjwndvbfjxafnolx.supabase.co/auth/v1/callback`
- Supabase Google provider: enter Client ID and Client Secret directly in the dashboard, and enable the provider.
- Supabase redirect allow list: `https://recycle.swscofficial.com/web-liff/index.html`

After provider setup, install `supabase/school-google-auth.sql`, test invalid tokens and valid school/non-school sessions, then publish the frontend. Test LINE + Google end-to-end before declaring this feature live. Staff admin and kiosk currently continue to use the existing verified LINE gateway; this feature changes the points website's login flow.

This is session-based verification: the points website requires an active Google session. The legacy manual binding RPC still exists for other clients. Follow-up deployments must install the new gateway after `security-hardening.sql`, which defines the older gateway.


