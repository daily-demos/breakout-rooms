import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <script
          defer
          src="https://widget-js.cometchat.io/v3/cometchatwidget.js"
        />
      </Head>
      <body>
        <Main />
        <div id="myportal" />
        <NextScript />
      </body>
    </Html>
  );
}
