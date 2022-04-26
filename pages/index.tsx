import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import { Button, Pane } from 'evergreen-ui';
import { useRouter } from 'next/router';

const Index = () => {
  const router = useRouter();

  const startCall = async () => {
    let options: any = { method: 'POST' };
    const res = await fetch('/api/createRoom', options);
    const { name } = await res.json();

    options.body = JSON.stringify({
      guid: name,
      groupName: 'Lobby',
    });
    await fetch('/api/createGroup', options);
    await router.push(`/${name}`);
  };

  return (
    <Pane>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      <Header />
      <main className="main">
        <h1 className="title">Breakout rooms + Comet chat demo</h1>
        <p className="description">
          Demo a breakout room UX built using Daily video APIs.
        </p>

        <Pane display="flex" padding={10}>
          <Button appearance="primary" onClick={startCall}>
            Start call
          </Button>
        </Pane>
      </main>
    </Pane>
  );
};

export default Index;
