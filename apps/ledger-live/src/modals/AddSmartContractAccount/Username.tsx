import { memo } from 'react';

type Props = {
  username: string;
  setUsername: (username: string) => void;
  goNextStep: () => void;
};

const UsernameStep = ({ username, setUsername, goNextStep }: Props) => {
  return (
    <>
      <div className="px-6">
        <label className="input input-bordered flex items-center gap-2">
          <input
            type="text"
            className="grow"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <span className="badge badge-info">.ledger.com</span>
        </label>
      </div>
      <hr className="border-zinc-700 my-4 mt-10" />
      <div className="flex px-6 justify-end items-center">
        <button className="btn btn-primary" disabled={!username} onClick={goNextStep}>
          <span>Continue</span>
        </button>
      </div>
    </>
  );
};

export default memo(UsernameStep);
