import React, { ChangeEvent, Dispatch, SetStateAction, useState } from 'react';
import { Dialog, Checkbox, Pane, TextInput, TextInputField } from "evergreen-ui";
import { DailyCall } from "@daily-co/daily-js";
import useBreakoutRoom from "./useBreakoutRoom";

type BreakoutModalType = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  call: DailyCall;
};

const BreakoutModal = ({ show, setShow, call }: BreakoutModalType) => {
  const { createSession } = useBreakoutRoom(call);

  const [config, setConfig] = useState({
    rooms: 2,
    auto_join: false,
    allow_user_exit: false,
    record_breakout_sessions: true,
    exp: false,
    expiryTime: 15,
  });

  const handleSubmit = async () => {
    const status = await createSession(config);
    if (status === 'success') setShow(false);
  };

  return (
    <Dialog
      isShown={show}
      title="Create breakout session"
      onCloseComplete={() => setShow(false)}
      preventBodyScrolling
      confirmLabel="Create"
      onConfirm={handleSubmit}
    >
      <div>
        <TextInputField
          label="Total number of breakout rooms"
          type="number"
          value={config.rooms}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, rooms: e.target.valueAsNumber })}
        />
        <Pane>
          <Checkbox
            label="Let participant join / change rooms freely"
            checked={config.auto_join}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, auto_join: e.target.checked })}
          />
          <Checkbox
            label="Allow participants to return to main lobby at any time"
            checked={config.allow_user_exit}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, allow_user_exit: e.target.checked })}
          />
          <Checkbox
            label={
            <>
              Automatically end breakout session after
                <input
                  type="number"
                  min={0}
                  value={config.expiryTime}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, expiryTime: e.target.valueAsNumber })}
                  style={{ margin: '0 5px', width: '40px' }}
                />
              minutes
            </>}
            checked={config.exp}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, exp: e.target.checked })}
          />
          <Checkbox
            label="Record breakout session (will start automatically)"
            checked={config.record_breakout_sessions}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, record_breakout_sessions: e.target.checked })}
          />
        </Pane>
      </div>
    </Dialog>
  )
};

export default BreakoutModal;

