/* Public Supabase settings. The publishable key is safe in the browser:
   anonymous visitors can only insert survey answers, ratings and lease-check stats, never read them (RLS). */
window.AB_CONFIG = {
  supabaseUrl: "https://nuaykiynlsxkzwdxkisk.supabase.co",
  supabaseKey: "sb_publishable_Geuo0qimmlDwGBucTwkP0A_XGiknxDx",
  // The survey and lease-check counters stay hidden until they reach this number.
  showCountFrom: 5
};
