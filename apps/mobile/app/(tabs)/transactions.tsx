import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../../src/auth';
import { createTransaction, listTransactions } from '../../src/repositories';
import { supabase } from '../../src/supabase';
import { styles } from '../../src/theme';

export default function Transactions() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['transactions', accountId], enabled: Boolean(supabase), queryFn: () => listTransactions(supabase!, { accountId: accountId || undefined, limit: 50 }) });
  const addExpense = async () => {
    if (!supabase || !session || !accountId || !/^\d+$/.test(amount) || amount === '0') { setError('Enter a valid account UUID and positive minor-unit amount.'); return; }
    try {
      setError(null);
      await createTransaction(supabase, { id: Crypto.randomUUID(), idempotencyKey: Crypto.randomUUID(), accountId, type: 'expense', classification: 'cash_payment', state: 'posted', amountMinor: amount, currency: 'PHP', transactionDate: new Date().toISOString().slice(0, 10), revision: 0 });
      setAmount(''); await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Transaction could not be saved.'); }
  };
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / LEDGER</Text><Text accessibilityRole="header" style={styles.title}>Transactions</Text>
    <Text style={styles.copy}>Posted records are immutable. Corrections create linked reversals.</Text>
    <Text style={styles.label}>Game account UUID</Text><TextInput accessibilityLabel="Game account UUID" value={accountId} onChangeText={setAccountId} style={styles.input} autoCapitalize="none" />
    <Text style={styles.label}>Expense in minor units</Text><TextInput accessibilityLabel="Expense amount" value={amount} onChangeText={setAmount} style={styles.input} keyboardType="number-pad" />
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Pressable accessibilityRole="button" onPress={() => void addExpense()} style={styles.button}><Text style={styles.buttonText}>Add posted expense</Text></Pressable>
    {!supabase && <Text style={styles.copy}>Connect Supabase to load your private ledger.</Text>}
    {query.isLoading && <Text style={styles.copy}>Loading ledger…</Text>}
    {query.data?.rows.length === 0 && <Text style={styles.copy}>No transactions match this filter.</Text>}
    {query.data?.rows.map(item => <Text key={item.id} style={styles.copy}>{item.transaction_date} · {item.amount_minor} {item.currency} · {item.state}</Text>)}
  </ScrollView>;
}
