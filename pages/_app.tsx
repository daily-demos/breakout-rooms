import '../styles/globals.css';
import '../styles/Home.css';
import type { AppProps } from 'next/app';
import { CallProvider } from '../contexts/CallProvider';
import { BreakoutRoomProvider } from '../contexts/BreakoutRoomProvider';
import { ThemeProvider, mergeTheme, defaultTheme } from 'evergreen-ui';

function MyApp({ Component, pageProps }: AppProps) {
  const theme = mergeTheme(defaultTheme, {
    components: {
      Button: {
        appearances: {
          primary: {
            backgroundColor: '#1BEBB9',
            color: 'black',
          }
        },
      },
    },
  });

  return (
    <ThemeProvider value={theme}>
      <CallProvider>
        <BreakoutRoomProvider>
          <Component {...pageProps} />
        </BreakoutRoomProvider>
      </CallProvider>
    </ThemeProvider>
  );
}

export default MyApp;
