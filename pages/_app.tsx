import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { CallProvider } from '../components/CallProvider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CallProvider>
      <Component {...pageProps} />
    </CallProvider>
  );
}

export default MyApp;
