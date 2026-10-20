import { useEffect, useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGate, AuthProvider, useAuth } from './auth';

function SessionQueries({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }));
  useEffect(() => () => queryClient.clear(), [queryClient]);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
function PrivateApp({ children }: PropsWithChildren) {
  const { session } = useAuth();
  return <AuthGate><SessionQueries key={session?.user.id}>{children}</SessionQueries></AuthGate>;
}
export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider><PrivateApp>{children}</PrivateApp></AuthProvider>;
}
