(function () {
  'use strict';
  const config = window.APP_CONFIG;
  const client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', storageKey: 'sappa-school-auth', storage: window.sessionStorage }
  });
  window.schoolAuth = {
    async login() {
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: {
        redirectTo: new URL('index.html', window.location.href).href.split('?')[0],
        queryParams: { hd: 'sappha.ac.th', prompt: 'select_account' }
      } });
      if (error) throw error;
    },
    async verify() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) return null;
      const result = await window.createSecureClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
        .rpc('verify_school_google', { p_access_token: data.session.access_token });
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    async signOut() { await client.auth.signOut({ scope: 'local' }); }
  };
})();
