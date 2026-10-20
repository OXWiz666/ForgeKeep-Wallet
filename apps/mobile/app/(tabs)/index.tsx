import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { styles } from '../../src/theme';

export default function HomeScreen() {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / WALLET</Text>
    <Text accessibilityRole="header" style={styles.title}>Know your spend. Track your value.</Text>
    <Text style={styles.copy}>Your private ledger for every realm, account, and character.</Text>
    <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push('/(tabs)/transactions')}>
      <Text style={styles.buttonText}>View transactions</Text>
    </Pressable>
  </ScrollView>;
}
