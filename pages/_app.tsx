import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { CallProvider } from '../components/CallProvider';
import { BreakoutRoomProvider } from '../components/BreakoutRoomProvider';

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
