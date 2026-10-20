import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text } from 'react-native';
import { supabase } from '../../src/supabase';
import { styles } from '../../src/theme';

export default function Portfolio() {
  const query = useQuery({ queryKey: ['portfolio', 'accounts'], enabled: Boolean(supabase), queryFn: async () => {
    const { data, error } = await supabase!.from('game_accounts').select('id, display_name, server, region, archived_at').order('display_name');
    if (error) throw new Error(error.message); return data ?? [];
  } });
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / PORTFOLIO</Text><Text accessibilityRole="header" style={styles.title}>Accounts and characters</Text>
    <Text style={styles.copy}>Archived accounts remain visible for ledger traceability.</Text>
    {!supabase && <Text style={styles.copy}>Connect Supabase to load your private portfolio.</Text>}
    {query.isLoading && <Text style={styles.copy}>Loading portfolio…</Text>}
    {query.data?.length === 0 && <Text style={styles.copy}>No game accounts yet.</Text>}
    {query.data?.map(account => <ScrollView key={account.id} style={styles.card}><Text style={styles.label}>{account.display_name}</Text><Text style={styles.copy}>{account.server ?? 'No server'} · {account.region ?? 'No region'}{account.archived_at ? ' · archived' : ''}</Text></ScrollView>)}
  </ScrollView>;
}
