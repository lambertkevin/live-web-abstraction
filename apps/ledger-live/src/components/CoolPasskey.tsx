import debounce from 'lodash/debounce';
import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useMotionValue, useMotionTemplate, motion } from 'framer-motion';
import { cn } from '../helpers';

const CoolPasskey = ({ text, className }: { text?: string; className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState('');
  const [mouseOver, setMouseOver] = useState(false);

  const newString = useCallback(async () => {
    setRandomString(generateRandomString(1500));
    await new Promise((resolve) => setTimeout(resolve, 100));
    newString();
  }, []);

  useEffect(() => {
    if (mouseOver) {
      newString();
    }
  }, [mouseOver]);

  useEffect(() => {
    newString();
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        'bg-transparent aspect-square flex items-center justify-center w-full h-full absolute',
        className || '',
      )}
    >
      <div
        onMouseMove={onMouseMove}
        onMouseEnter={() => setMouseOver(true)}
        onMouseLeave={() => setMouseOver(false)}
        className="group/card w-full relative overflow-hidden bg-transparent flex items-center justify-center h-full"
      >
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-full w-full rounded-full flex items-center justify-center text-white font-bold text-4xl">
            <span className="text-white z-20 text-xl" style={{ textShadow: '0 2px 2px rgba(0,0,0,0.7)' }}>
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPattern({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none opacity-60">
      <div className="absolute inset-0 [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = (length: number) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default memo(CoolPasskey);
