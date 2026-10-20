import 'react-native-url-polyfill/auto';
import { Stack } from "expo-router";
import { AppProviders } from '../src/providers';

export default function RootLayout() {
  return <AppProviders><Stack screenOptions={{ headerShown: false }} /></AppProviders>;
}
