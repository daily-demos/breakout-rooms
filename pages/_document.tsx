import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <script src="https://cdn.socket.io/4.4.1/socket.io.min.js" />
      </Head>
      <body>
        <Main />
        <div id="myportal" />
        <NextScript />
      </body>
    </Html>
  );
}
