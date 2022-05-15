import React from 'react';
import Head from 'next/head';
import { Button, Card, Heading, Pane, Text } from 'evergreen-ui';
import { ReactComponent as IconOne } from '../../icons/1-sm.svg';
import { ReactComponent as IconTwo } from '../../icons/2-sm.svg';
import Header from '../Header';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useCall } from '../../contexts/CallProvider';
import { useRouter } from 'next/router';

const Hero = () => {
  const router = useRouter();
  const { room } = router.query;
  const { width } = useWindowSize();
  const { joinAs } = useCall();

  const join = (owner: boolean = false) => joinAs(room as string, owner);

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
          <Pane display={width < 630 ? 'initial' : 'flex'} gap={15}>
            <Card
              padding={20}
              paddingBottom={5}
              width={302}
              height={232}
              border="1px solid #C8D1DC"
              borderRadius={8}
              marginY={24}
              position="relative"
            >
              <Pane
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                marginBottom={10}
              >
                <IconOne style={{ marginRight: '10px' }} />
                <Heading>Enter as owner</Heading>
              </Pane>
              <Text size={10} lineHeight={1.5}>
                Join call in new tab as a meeting owner. You can configure
                breakout rooms, and manage settings.
              </Text>
              <Pane position="absolute" bottom={20}>
                <Button appearance="primary" onClick={() => join(true)}>
                  Join as owner
                </Button>
              </Pane>
            </Card>

            <Card
              padding={20}
              paddingBottom={5}
              width={302}
              height={232}
              border="1px solid #C8D1DC"
              borderRadius={8}
              marginY={24}
              position="relative"
            >
              <Pane
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                marginBottom={10}
              >
                <IconTwo style={{ marginRight: '10px' }} />
                <Heading>Add participants</Heading>
              </Pane>
              <Pane marginBottom={4}>
                <Text color="red">Add an owner to the room </Text>
                <Text color="muted">
                  prior to adding additional participants.
                </Text>
              </Pane>
              <Text size={10} lineHeight={1.5}>
                Select this option to join from the perspective of a
                participant.
              </Text>
              <Pane position="absolute" bottom={20}>
                <Button onClick={() => join()}>Join as participant</Button>
              </Pane>
            </Card>
          </Pane>
          <Text color="muted">
            We recommend joining as an owner in one tab, and adding participants
            via another browser.
          </Text>
        </Pane>
      </Pane>
    </Pane>
  );
};

export default Hero;
