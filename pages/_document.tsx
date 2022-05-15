import { Html, Head, Main, NextScript } from 'next/document';
import { extractStyles } from 'evergreen-ui';

export default function Document() {
  const { css, hydrationScript } = extractStyles();

  return (
    <Html>
      <Head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </Head>
      <body>
        <Main />
        <div id="myportal" />
        {hydrationScript}
        <NextScript />
      </body>
    </Html>
  );
}
