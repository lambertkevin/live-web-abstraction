import React from 'react';
import House from './House';
import Graph from './Graph';
import News from './News';
import Wallet from './Wallet';
import Planet from './Planet';
import ArrowFromBottom from './ArrowFromBottom';
import ArrowToBottom from './ArrowToBottom';
import Buy from './Buy';
import Lend from './Lend';
import Swap from './Swap';
import Card from './Card';
import Gift from './Gift';
import Shield from './Shield';
import Nano from './Nano';
import Coins from './Coins';

export type Props = {
  size?: number;
  color?: string | null;
  stroke?: string | null;
  className?: string | null;
};
export const iconsList: Record<string, React.MemoExoticComponent<(props: Props) => React.JSX.Element>> = {
  house: House,
  graph: Graph,
  news: News,
  wallet: Wallet,
  planet: Planet,
  arrowFromBottom: ArrowFromBottom,
  arrowToBottom: ArrowToBottom,
  lend: Lend,
  buy: Buy,
  swap: Swap,
  card: Card,
  gift: Gift,
  shield: Shield,
  nano: Nano,
  coins: Coins,
};
