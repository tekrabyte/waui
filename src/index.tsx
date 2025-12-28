import './index.css';
import { createRoot } from "react-dom/client"; 
import { App } from "./App";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Buat Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Opsional: agar tidak refresh saat pindah tab
      retry: 1,
    },
  },
});

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  // 2. Bungkus App dengan Provider
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}