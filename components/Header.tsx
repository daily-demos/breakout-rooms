import React from 'react';
import { Image, Strong, Pane, Button, IconButton } from 'evergreen-ui';
import { ReactComponent as IconLink } from './icons/link-sm.svg';
import { ReactComponent as IconGithub } from './icons/github-sm.svg';
import { useRouter } from 'next/router';

const Header = () => {
  const router = useRouter();

  return (
    <header>
      <Pane
        display="flex"
        padding={15}
        background="#EFF3F5"
        borderBottom="1px solid #C8D1DC"
      >
        <Pane flex={1} alignItems="center" display="flex">
          <Image src="/daily-logo.svg" alt="Daily Logo" />
          <Strong marginLeft={20}>Breakout Room demo</Strong>
        </Pane>
        <Pane>
          <Button
            iconAfter={IconLink}
            onClick={() => router.push('https://docs.daily.co')}
          >
            API docs
          </Button>
          <div
            style={{
              display: 'inline-flex',
              border: '1px solid #C8D1DC',
              height: '75%',
              width: 0,
              margin: '0 15px',
              verticalAlign: 'middle',
            }}
          />
          <IconButton
            appearance="minimal"
            icon={IconGithub}
            onClick={() =>
              router.push('https://github.com/daily-demos/breakout-rooms')
            }
          />
        </Pane>
      </Pane>
    </header>
  );
};

export default Header;
