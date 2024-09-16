import { memo } from 'react';

export const Discover = () => {
  return (
    <div className="flex flex-col flex-grow">
      <h1 className="text-3xl font-medium uppercase py-8">Discover</h1>
      <div className="grid grid-cols-3 gap-4">
        <div
          className="border border-zinc-700 px-4 py-6 rounded-xl aspect-[25/10] flex flex-col justify-between hover:outline outline-[#36324E] outline-4 hover:outline-offset-1 cursor-pointer hover:border hover:border-primary"
          onClick={() => {
            window.open('http://localhost:4341/', '_blank');
          }}
        >
          <div className="flex flex-row gap-3">
            <div className="avatar">
              <div className="w-10 rounded-xl">
                <img src="https://i.ytimg.com/vi/ckYVhmTJ6lQ/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDLP2lJZvZEchTB9i7v_Pl30f6nyg" />
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">Qui Veut Être Mon NFT ?</h2>
              <span className="text-zinc-500">Devenez millionaires.</span>
            </div>
          </div>
          <div className="text-lg text-zinc-400">Mint ton premier NFT et deviens millionaire tout simplement.</div>
        </div>
        <div
          className="border border-zinc-700 px-4 py-6 rounded-xl aspect-[25/10] flex flex-col justify-between hover:outline outline-[#36324E] outline-4 hover:outline-offset-1 cursor-pointer hover:border hover:border-primary"
          onClick={() => {
            window.open('http://localhost:4343/', '_blank');
          }}
        >
          <div className="flex flex-row gap-3">
            <div className="avatar">
              <div className="w-10 rounded-xl">
                <img src="https://cryptologos.cc/logos/uniswap-uni-logo.png" />
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">Uniswap</h2>
              <span className="text-zinc-500">Trade your shitcoins</span>
            </div>
          </div>
          <div className="text-lg text-zinc-400">Deviens pauvre en PEPE en quelques clics.</div>
        </div>
      </div>
    </div>
  );
};

export default memo(Discover);
