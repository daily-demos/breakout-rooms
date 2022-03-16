![breakout-rooms-cover](./public/breakout-room-modal.png)

# Daily Breakout Rooms

## Demo features

- Allows joining as `Owner` or `Participant` for the call.
- Private rooms (both the lobby and breakout rooms) - users will be need tokens to join.
- It supports a few configurations like
    - `rooms` - the total number of rooms the users must be divided into once the breakout rooms start.
    - `auto_join` - if they should be automatically joined into any breakout room when the session is active, or should we let them choose the breakout room to join.
    - `allow_user_exist` - to let users leave the breakout rooms that they are assigned.
    - `exp` - expiry datetime when the breakout rooms expire and all the participants will be moved into the main lobby.
    - `auto_record` - allows to auto-record (cloud recording) breakout rooms.
- Lets owners assign rooms to participants.
- Allows managing breakout rooms for owners of the call.

## Technical implementation

- We made the following events for the breakout rooms, and they will be dispatched to everyone in the call,
  - `DAILY_BREAKOUT_STARTED` - this event dispatches whenever an owner starts the breakout session.
  - `DAILY_BREAKOUT_UPDATED` - this event dispatches whenever a participant changes their respective rooms and also when an owner updates the configuration of the breakout session.
  - `DAILY_BREAKOUT_CONCLUDED` - this event dispatches whenever owner of the call ends the breakout session.
  - `DAILY_BREAKOUT_REQUEST` - whenever a new participant joins the main lobby, after starting the breakout session, he will be needing the breakout session object to join any breakout room, so we are using this request method to get the breakout session object from the participants who are in the call.
  - `DAILY_BREAKOUT_SYNC` - if someone in the call receives the `DAILY_BREAKOUT_REQUEST` and if the participant has the breakout session object with him, the object will be sent to everyone in the call. 

We are using [socket.io](https://socket.io) to listen to all the events in the call, we can't use the Daily's inbuilt `sendAppMessage` event as the participants will be in different calls and `sendAppMessage` will only listen to the events who are in the same call.  

## Getting Started

This demo is intended to be used with a `private` Daily [room](https://docs.daily.co/reference/rest-api/rooms/config#privacy). This helps avoid participants joining the room from external links (i.e. not within the breakout room app.)

To create a new private room, use either the Daily [REST API](https://docs.daily.co/reference/rest-api/rooms/create-room) or the [Daily dashboard](https://dashboard.daily.co/rooms/create)."

1. Installing the dependencies

```bash
npm install
# or
yarn install
```

2. Setting up environment variables

```bash
cp .env.example .env.local
```

Now, you can update your variables accordingly in `.env.local` file.

4. Running the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Learn More

To learn more about Next.js and Typescript, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Typescript Documentation](https://www.typescriptlang.org/docs/) - learn about Typescript.
