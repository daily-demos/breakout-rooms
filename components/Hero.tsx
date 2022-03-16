import React from 'react';
import Head from 'next/head';
import { Button, Image } from 'evergreen-ui';

type HeroType = {
  joinAs: (owner?: boolean) => void;
};

const Hero = ({ joinAs }: HeroType) => {
  return (
    <div className="container">
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      <main className="main">
        <Image src="/daily-logo.svg" alt="Daily Logo" />
        <h1 className="title">
          Welcome to <span>Breakout Rooms!</span>
        </h1>

        <p className="description">Get started by joining a room</p>

        <div className="join">
          <Button
            appearance="primary"
            marginRight={16}
            onClick={() => joinAs(true)}
          >
            Join as owner
          </Button>
          <Button onClick={() => joinAs()}>Join as participant</Button>
        </div>
      </main>
    </div>
  );
};

export default Hero;
