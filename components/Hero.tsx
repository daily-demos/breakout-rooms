import React from 'react';
import styles from '../styles/Home.module.css';
import Head from 'next/head';
import { Button, Image } from 'evergreen-ui';

type HeroType = {
  joinAs: (owner?: boolean) => void;
};

const Hero = ({ joinAs }: HeroType) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      <main className={styles.main}>
        <Image src="/daily-logo.svg" alt="Daily Logo" />
        <h1 className={styles.title}>
          Welcome to <span>Breakout Rooms!</span>
        </h1>

        <p className={styles.description}>Get started by joining a room</p>

        <div className={styles.join}>
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
