import '../styles/globals.css';
import '../styles/Home.css';
import type { AppProps } from 'next/app';
import { CallProvider } from '../contexts/CallProvider';
import { BreakoutRoomProvider } from '../contexts/BreakoutRoomProvider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CallProvider>
      <BreakoutRoomProvider>
        <Component {...pageProps} />
      </BreakoutRoomProvider>
    </CallProvider>
  );
}

export default MyApp;
