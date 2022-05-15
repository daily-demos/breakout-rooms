import type { AppProps } from 'next/app';
import { ThemeProvider, mergeTheme, defaultTheme } from 'evergreen-ui';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const color = 'green';
  const theme = mergeTheme(defaultTheme, {
    components: {
      Button: {
        appearances: {
          primary: {
            backgroundColor: '#1BEBB9',
            color: 'black',
            _disabled: {
              backgroundColor: `colors.${color}100`,
              borderColor: `colors.${color}100`,
              cursor: 'not-allowed',
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider value={theme}>
      {/*
      // @ts-ignore */}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
