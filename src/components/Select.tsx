import { memo } from 'react';
import classNames from 'classnames';
import { default as ReactSelect, components } from 'react-select';
import type { ControlProps, Props as ReactSelectProps } from 'react-select';
import MagGlass from '../components/icons/MagGlass';
import { theme } from '../config';

type Props = Omit<ReactSelectProps, 'classnames'>;

const Control = ({ children, ...props }: ControlProps) => (
  <components.Control {...props}>
    {(props.hasValue && props.menuIsOpen) || !props.hasValue ? (
      <div className="ml-3 mr-0">
        <MagGlass size={20} color={theme.colors.zinc['600']} />
      </div>
    ) : null}{' '}
    {children}
  </components.Control>
);

const Select = (props: Props) => {
  return (
    <ReactSelect
      unstyled
      classNames={{
        clearIndicator: ({ isFocused }) =>
          classNames(
            isFocused ? 'text-neutral-600' : 'text-neutral-200',
            'p-2',
            isFocused ? 'hover:text-neutral-800' : 'hover:text-zinc-700',
          ),
        control: ({ isDisabled, isFocused }) =>
          classNames(
            isDisabled ? 'bg-neutral-50' : 'bg-transparent',
            isDisabled ? 'border-zinc-900' : isFocused ? 'border-primary' : 'border-zinc-700',
            'rounded',
            'border',
            isFocused ? '' : 'hover:border-slate-300',
          ),
        dropdownIndicator: ({ isFocused }) => classNames(isFocused ? 'text-zinc-800' : 'text-zinc-500', 'p-2'),
        group: () => classNames('py-2'),
        groupHeading: () => classNames('text-zinc-700', 'text-xs', 'font-medium', 'mb-1', 'px-3', 'uppercase'),
        indicatorSeparator: () => '',
        input: () => classNames('m-1', 'py-1.5'),
        loadingIndicator: ({ isFocused }) => classNames(isFocused ? 'text-neutral-600' : 'text-neutral-200', 'p-2'),
        loadingMessage: () => classNames('text-zinc-700', 'py-2', 'px-3'),
        menu: () =>
          classNames(
            'bg-zinc-900',
            'rounded-xs',
            'shadow-[0_0_0_1px_rgba(0,0,0,0.1)]',
            'my-1',
            'border',
            'border-zinc-700',
          ),
        menuList: () => classNames('py-1'),
        multiValueRemove: ({ isFocused }) =>
          classNames('rounded-sm', isFocused && 'bg-red-500', 'px-1', 'hover:bg-red-500', 'hover:text-red-800'),
        noOptionsMessage: () => classNames('text-zinc-700', 'py-2', 'px-3'),
        option: ({ isDisabled, isSelected }) =>
          classNames(
            isSelected ? 'bg-zinc-950' : '',
            isDisabled ? 'text-neutral-200' : '',
            'py-1',
            'my-1',
            'px-3',
            'active:bg-zinc-800',
            'hover:bg-zinc-950',
          ),
        placeholder: () => classNames('text-neutral-500'),
        singleValue: ({ isDisabled, selectProps }) =>
          classNames(isDisabled ? 'text-zinc-900' : 'text-inherit', selectProps.menuIsOpen ? 'opacity-0' : ''),
        valueContainer: ({ hasValue }) => classNames('py-0.5', 'px-2', hasValue ? 'has-value' : ''),
      }}
      components={{ Control }}
      {...props}
    />
  );
};

export default memo(Select);
