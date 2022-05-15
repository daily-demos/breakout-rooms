import type { NextPage } from 'next';
import { Pane } from 'evergreen-ui';

const Home: NextPage = () => {
  return (
    <Pane
      display="flex"
      width="100vw"
      height="100vh"
      justifyContent="center"
      alignItems="center"
    >
      Hello
    </Pane>
  );
};

export default Home;
