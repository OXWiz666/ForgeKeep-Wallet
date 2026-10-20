import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text } from 'react-native';
import { money } from '@forgekeep/financial-engine';
import { listTransactions } from '../../src/repositories';
import { summarizeCashFlow } from '../../src/dashboard';
import { supabase } from '../../src/supabase';
import { styles } from '../../src/theme';

export default function Analytics() {
  const query = useQuery({ queryKey: ['analytics', 'cash-flow'], enabled: Boolean(supabase), queryFn: async () => {
    const result = await listTransactions(supabase!, { state: 'posted', limit: 100 });
    return summarizeCashFlow(result.rows.map(row => ({ state: row.state, classification: row.classification, money: money(BigInt(String(row.amount_minor)), row.currency) })));
  } });
  const cashFlow = query.data?.kind === 'applicable' ? query.data.value : null;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / ANALYTICS</Text><Text accessibilityRole="header" style={styles.title}>Realized cash flow</Text>
    <Text style={styles.copy}>Only posted cash payments and receipts are included. Estimates stay separate.</Text>
    {!supabase && <Text style={styles.copy}>Connect Supabase to load analytics.</Text>}
    {query.isLoading && <Text style={styles.copy}>Calculating…</Text>}
    {cashFlow && <ScrollView style={styles.card}><Text style={styles.label}>Payments</Text><Text style={styles.copy}>{cashFlow.payments.amountMinor.toString()} {cashFlow.payments.currency}</Text><Text style={styles.label}>Receipts</Text><Text style={styles.copy}>{cashFlow.receipts.amountMinor.toString()} {cashFlow.receipts.currency}</Text><Text style={styles.label}>Net cash flow</Text><Text style={styles.copy}>{cashFlow.netCashFlow.amountMinor.toString()} {cashFlow.netCashFlow.currency}</Text></ScrollView>}
    {query.data && !cashFlow && <Text style={styles.copy}>No realized cash flow is available yet.</Text>}
  </ScrollView>;
}
