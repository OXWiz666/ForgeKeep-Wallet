import { ScrollView, Text } from 'react-native';
import { styles } from './theme';

export function ShellScreen({ title, description }: { title: string; description: string }) {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / WALLET</Text>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.copy}>{description}</Text>
  </ScrollView>;
}
