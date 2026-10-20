import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, Text } from 'react-native';
import { money } from '@forgekeep/financial-engine';
import { summarizeCashFlow } from '../../src/dashboard';
import { listTransactions } from '../../src/repositories';
import { supabase } from '../../src/supabase';
import { styles } from '../../src/theme';

export default function HomeScreen() {
  const query = useQuery({
    queryKey: ['dashboard', 'cash-flow'],
    enabled: Boolean(supabase),
    queryFn: async () => {
      const result = await listTransactions(supabase!, { state: 'posted', limit: 100 });
      return summarizeCashFlow(result.rows.map(row => ({ state: row.state, classification: row.classification, money: money(BigInt(String(row.amount_minor)), row.currency) })));
    },
  });
  const cashFlow = query.data?.kind === 'applicable' ? query.data.value : null;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / WALLET</Text>
    <Text accessibilityRole="header" style={styles.title}>Know your spend. Track your value.</Text>
    <Text style={styles.copy}>Your private ledger for every realm, account, and character.</Text>
    <ScrollView style={styles.card}><Text style={styles.label}>Dashboard</Text><Text style={styles.copy}>{cashFlow ? `Net cash flow: ${cashFlow.netCashFlow.amountMinor.toString()} ${cashFlow.netCashFlow.currency}` : 'Connect Supabase to see realized cash flow.'}</Text><Text style={styles.copy}>Posted entries only · estimates stay separate</Text></ScrollView>
    <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push('/(tabs)/transactions')}>
      <Text style={styles.buttonText}>View transactions</Text>
    </Pressable>
  </ScrollView>;
}
