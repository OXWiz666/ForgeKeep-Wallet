import { Tabs } from "expo-router";
import { Text } from 'react-native';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64 },
    tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 12 },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home', tabBarIcon: ({ color }) => <Text accessible={false} style={{ color }}>⌂</Text> }} />
    <Tabs.Screen name="transactions" options={{ title: 'Transactions', tabBarAccessibilityLabel: 'Transactions', tabBarIcon: ({ color }) => <Text accessible={false} style={{ color }}>≡</Text> }} />
    <Tabs.Screen name="portfolio" options={{ title: 'Portfolio', tabBarAccessibilityLabel: 'Portfolio', tabBarIcon: ({ color }) => <Text accessible={false} style={{ color }}>◇</Text> }} />
    <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarAccessibilityLabel: 'Analytics', tabBarIcon: ({ color }) => <Text accessible={false} style={{ color }}>↗</Text> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarAccessibilityLabel: 'Profile', tabBarIcon: ({ color }) => <Text accessible={false} style={{ color }}>●</Text> }} />
  </Tabs>;
}
