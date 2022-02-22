import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Button } from 'evergreen-ui';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const router = useRouter();

  const join = async (owner = false) => {
    if (owner) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ is_owner: owner }),
      };

      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      await router.push(`/room?t=${token}`);
    } else await router.push('/room');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span>Breakout Rooms!</span>
        </h1>

        <p className={styles.description}>Get started by joining a room!</p>

        <div className={styles.join}>
          <Button
            appearance="primary"
            marginRight={16}
            onClick={() => join(true)}
          >
            Join as owner
          </Button>
          <Button onClick={() => join()}>Join as participant</Button>
        </div>
      </main>
    </div>
  );
};

export default Home;
