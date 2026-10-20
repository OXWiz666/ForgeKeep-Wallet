import { StyleSheet } from 'react-native';

export const colors = {
  background: '#121018', surface: '#1a1721', border: '#51485e',
  text: '#f5f1ff', muted: '#b9b0c8', accent: '#c9baff', button: '#b59cff',
  onButton: '#17121f', error: '#ffb4b4',
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 28, paddingTop: 64, gap: 20, flexGrow: 1 },
  kicker: { color: colors.accent, fontSize: 11, letterSpacing: 1.4, fontWeight: '700' },
  title: { color: colors.text, fontSize: 32, lineHeight: 39, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 17, lineHeight: 25 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  input: { minHeight: 52, color: colors.text, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 17 },
  button: { minHeight: 52, justifyContent: 'center', backgroundColor: colors.button, padding: 16, borderRadius: 12 },
  buttonText: { color: colors.onButton, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  secondary: { minHeight: 52, justifyContent: 'center', borderWidth: 1,
    borderColor: colors.border, padding: 16, borderRadius: 12 },
  secondaryText: { color: colors.accent, fontSize: 16, textAlign: 'center', fontWeight: '700' },
  error: { color: colors.error, fontSize: 16, lineHeight: 24 },
  disabled: { opacity: 0.55 },
});
