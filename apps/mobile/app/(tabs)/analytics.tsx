import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { money } from '@forgekeep/financial-engine';
import { calculateScenario, summarizeCashFlow } from '../../src/dashboard';
import { listTransactions } from '../../src/repositories';
import { supabase } from '../../src/supabase';
import { styles } from '../../src/theme';

export default function Analytics() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [costs, setCosts] = useState('0');
  const [recovered, setRecovered] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [fee, setFee] = useState('0');
  const [fixedFees, setFixedFees] = useState('0');
  const query = useQuery({
    queryKey: ['analytics', 'cash-flow', from, to],
    enabled: Boolean(supabase),
    queryFn: async () => {
      const result = await listTransactions(supabase!, { state: 'posted', limit: 100, ...(from ? { from } : {}), ...(to ? { to } : {}) });
      return summarizeCashFlow(result.rows.map(row => ({ state: row.state, classification: row.classification, money: money(BigInt(String(row.amount_minor)), row.currency) })));
    },
  });
  const scenario = useMemo(() => {
    const integer = (value: string) => /^\d+$/.test(value) ? BigInt(value) : 0n;
    return calculateScenario({ recordedCashCosts: money(integer(costs), 'PHP'), previouslyRecoveredCash: money(integer(recovered), 'PHP'), expectedSalePrice: money(integer(salePrice), 'PHP'), saleFeeBasisPoints: integer(fee), fixedFees: money(integer(fixedFees), 'PHP') });
  }, [costs, recovered, salePrice, fee, fixedFees]);
  const cashFlow = query.data?.kind === 'applicable' ? query.data.value : null;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / ANALYTICS</Text>
    <Text accessibilityRole="header" style={styles.title}>Realized cash flow</Text>
    <Text style={styles.copy}>Only posted cash payments and receipts are included. Estimates stay separate.</Text>
    <Text style={styles.label}>Date range (YYYY-MM-DD)</Text>
    <TextInput accessibilityLabel="Start date" placeholder="From" placeholderTextColor="#8d8498" style={styles.input} value={from} onChangeText={setFrom} autoCapitalize="none" />
    <TextInput accessibilityLabel="End date" placeholder="To" placeholderTextColor="#8d8498" style={styles.input} value={to} onChangeText={setTo} autoCapitalize="none" />
    {!supabase && <Text style={styles.copy}>Connect Supabase to load analytics.</Text>}
    {query.isLoading && <Text style={styles.copy}>Calculating…</Text>}
    {cashFlow && <ScrollView style={styles.card}><Text style={styles.label}>Payments</Text><Text style={styles.copy}>{cashFlow.payments.amountMinor.toString()} {cashFlow.payments.currency}</Text><Text style={styles.label}>Receipts</Text><Text style={styles.copy}>{cashFlow.receipts.amountMinor.toString()} {cashFlow.receipts.currency}</Text><Text style={styles.label}>Net cash flow</Text><Text style={styles.copy}>{cashFlow.netCashFlow.amountMinor.toString()} {cashFlow.netCashFlow.currency}</Text></ScrollView>}
    {query.data && !cashFlow && <Text style={styles.copy}>No realized cash flow is available yet.</Text>}
    <Text accessibilityRole="header" style={styles.title}>Hypothetical exit</Text>
    <Text style={styles.copy}>These editable values are estimates and never change realized ledger totals.</Text>
    <TextInput accessibilityLabel="Recorded costs" keyboardType="number-pad" style={styles.input} value={costs} onChangeText={setCosts} />
    <TextInput accessibilityLabel="Previously recovered cash" keyboardType="number-pad" style={styles.input} value={recovered} onChangeText={setRecovered} />
    <TextInput accessibilityLabel="Expected sale price" keyboardType="number-pad" style={styles.input} value={salePrice} onChangeText={setSalePrice} />
    <TextInput accessibilityLabel="Sale fee basis points" keyboardType="number-pad" style={styles.input} value={fee} onChangeText={setFee} />
    <TextInput accessibilityLabel="Fixed fees" keyboardType="number-pad" style={styles.input} value={fixedFees} onChangeText={setFixedFees} />
    <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => undefined}><Text style={styles.secondaryText}>Recalculate estimate</Text></Pressable>
    {scenario.kind === 'applicable' && <ScrollView style={styles.card}><Text style={styles.label}>HYPOTHETICAL / NET PROCEEDS</Text><Text style={styles.copy}>{scenario.value.netSaleProceeds.amountMinor.toString()} PHP</Text><Text style={styles.label}>Hypothetical profit</Text><Text style={styles.copy}>{scenario.value.hypotheticalExitProfit.amountMinor.toString()} PHP</Text></ScrollView>}
  </ScrollView>;
}
