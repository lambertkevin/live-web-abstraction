import classNames from 'classnames';
import { memo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { iconsList } from './icons';
import { theme } from '../config';

const links: {
  icon: string;
  name: string;
  path: string;
}[] = [
  {
    icon: 'house',
    name: 'Portfolio',
    path: '/portfolio',
  },
  {
    icon: 'graph',
    name: 'Market',
    path: '/market',
  },
  {
    icon: 'wallet',
    name: 'Accounts',
    path: '/',
  },
  {
    icon: 'planet',
    name: 'Discover',
    path: '/discover',
  },
  {
    icon: 'arrowFromBottom',
    name: 'Send',
    path: '/send',
  },
  {
    icon: 'arrowToBottom',
    name: 'Receive',
    path: '/receive',
  },
  {
    icon: 'lend',
    name: 'Earn',
    path: '/earn',
  },
  {
    icon: 'buy',
    name: 'Buy / Sell',
    path: '/buy',
  },
  {
    icon: 'swap',
    name: 'Swap',
    path: '/swap',
  },
  {
    icon: 'gift',
    name: 'Refer a friend',
    path: '/referal',
  },
  {
    icon: 'card',
    name: 'Card',
    path: '/card',
  },
  {
    icon: 'shield',
    name: '[L] Recover',
    path: '/recover',
  },
  {
    icon: 'nano',
    name: 'My Ledger',
    path: '/manager',
  },
];

const Sidebar = () => {
  const classNameSelector = useCallback(
    ({ isActive }: { isActive: boolean }) => (isActive ? 'navlink-active bg-zinc-700 text-slate-200' : ''),
    [],
  );

  return (
    <aside className="bg-zinc-900 h-screen w-56 p-4 flex-col text-base text-zinc-400 pt-20 fixed">
      <h2 className="uppercase text-xs tracking-[0.2em] text-white mb-4">Menu</h2>
      <ul>
        {links.map((link, i) => (
          <li key={i} className="m-2">
            <NavLink
              to={link.path}
              className={(props) =>
                classNames([
                  classNameSelector(props),
                  'navlink w-full h-full p-3 rounded flex justify-stretch items-center hover:text-slate-200',
                ])
              }
            >
              {({ isActive }) => {
                const Icon = iconsList[link.icon];

                return (
                  <>
                    <div className=" w-4 mr-2">
                      {Icon && <Icon color={isActive ? theme.colors.violet['400'] : null} />}
                    </div>
                    <div className="flex-grow">{link.name}</div>
                  </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default memo(Sidebar);
