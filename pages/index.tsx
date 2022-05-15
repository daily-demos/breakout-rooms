import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import { Button, Pane, Heading, Text } from 'evergreen-ui';
import { useRouter } from 'next/router';
import { NextPage } from 'next';

const Index: NextPage = () => {
  const router = useRouter();

  const startCall = async () => {
    const options = { method: 'POST' };
    const res = await fetch('/api/createRoom', options);
    const { name } = await res.json();
    await router.push(`/${name}`);
  };

  return (
    <Pane>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      <Pane height="100vh" width="100vw">
        <Header />
        <Pane
          display="flex"
          width="100%"
          height="90%"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <Heading size={900} marginY={5}>
            Breakout Rooms
          </Heading>
          <Text marginY={5}>
            Demo a breakout room UX built using Daily video APIs.
          </Text>
          <Pane display="flex" padding={10}>
            <Button appearance="primary" onClick={startCall}>
              Start call
            </Button>
          </Pane>
        </Pane>
      </Pane>
    </Pane>
  );
};

export default Index;
