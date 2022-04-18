import React from 'react';
import Head from 'next/head';
import { Button, Card, Pane } from 'evergreen-ui';
import { ReactComponent as IconOne } from './icons/1-sm.svg';
import { ReactComponent as IconTwo } from './icons/2-sm.svg';
import Header from './Header';
import { useWindowSize } from '../hooks/useWindowSize';
import { useBreakoutRoom } from '../contexts/BreakoutRoomProvider';

const Hero = () => {
  const { joinAs } = useBreakoutRoom();
  const { width } = useWindowSize();

  return (
    <Pane>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      <Header />
      <main className="main">
        <h1 className="title">Breakout room demo</h1>
        <p className="description">
          Demo a breakout room UX built using Daily video APIs.
        </p>

        <Pane display={width < 630 ? 'initial' : 'flex'} gap={15}>
          <Card
            padding={20}
            paddingBottom={5}
            width={302}
            height={232}
            border="1px solid #C8D1DC"
            borderRadius={8}
            marginY={24}
          >
            <div className="join-header">
              <IconOne style={{ marginRight: '10px' }} />
              Enter as owner
            </div>
            <p className="join-text">
              Join call in new tab as a meeting owner. You can configure
              breakout rooms, and manage settings.
            </p>
            <div className="join-footer">
              <Button appearance="primary" onClick={() => joinAs(true)}>
                Join as owner
              </Button>
            </div>
          </Card>

          <Card
            padding={20}
            paddingBottom={5}
            width={302}
            height={232}
            border="1px solid #C8D1DC"
            borderRadius={8}
            marginY={24}
          >
            <div className="join-header">
              <IconTwo style={{ marginRight: '10px' }} />
              Add participants
            </div>
            <div className="join-alert-text">
              <span>Add an owner to the room</span> prior to adding additional
              participants.
            </div>
            <p className="join-text">
              Select this option to join from the perspective of a participant.
            </p>
            <div className="join-footer">
              <Button onClick={() => joinAs()}>Join as participant</Button>
            </div>
          </Card>
        </Pane>

        <p className="help-text">
          We recommend joining as an owner in one tab, and adding participants
          via another browser.
        </p>
      </main>
    </Pane>
  );
};

export default Hero;
