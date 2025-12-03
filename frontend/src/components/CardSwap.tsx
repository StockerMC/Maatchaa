"use client"

import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef, CSSProperties, ReactNode } from 'react';
import gsap from 'gsap';

interface CardProps {
  customClass?: string;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, ...rest }, ref) => {
  const cardStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderRadius: '12px',
    border: '1px solid #fff',
    background: '#000',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    ...rest.style
  };

  return (
    <div
      ref={ref}
      {...rest}
      className={`${customClass ?? ''} ${rest.className ?? ''}`.trim()}
      style={cardStyle}
    />
  );
});
Card.displayName = 'Card';

interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

interface CardSwapProps {
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (index: number) => void;
  skewAmount?: number;
  easing?: 'elastic' | 'smooth';
  children: ReactNode;
}

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children
}: CardSwapProps) => {
  const config = useMemo(() =>
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        }, [easing]);

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    [childArr]
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | undefined>(undefined);
  const container = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  // Initial card placement - runs once
  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      }
    });
  }, [refs, cardDistance, verticalDistance, skewAmount]);

  // Animation loop
  useEffect(() => {
    const swap = () => {
      if (order.current.length < 2 || isAnimating.current) return;

      isAnimating.current = true;

      const front = order.current[0];
      const elFront = refs[front].current;
      if (!elFront) {
        isAnimating.current = false;
        return;
      }

      if (tlRef.current) {
        tlRef.current.kill();
      }

      const failsafeTimeout = setTimeout(() => {
        if (isAnimating.current) {
          console.warn('Animation stuck, resetting...');
          isAnimating.current = false;
        }
      }, (config.durDrop + config.durMove + config.durReturn + 2) * 1000);

      const resetAnimation = () => {
        isAnimating.current = false;
        clearTimeout(failsafeTimeout);
      };

      const tl = gsap.timeline({
        onComplete: resetAnimation,
        onInterrupt: resetAnimation
      });
      tlRef.current = tl;

      // Ensure front card stays on top during the entire drop animation
      const highestZIndex = refs.length + 10;
      gsap.set(elFront, { zIndex: highestZIndex });

      tl.to(elFront, {
        x: '+=600',
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      order.current.slice(1).forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease
          },
          `promote+=${i * 0.1}`
        );
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      tl.addLabel('return', `promote+=${config.durMove * 0.5}`);
      // Only change z-index to back position right before returning
      tl.set(elFront, { zIndex: backSlot.zIndex }, 'return');
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease
        },
        'return'
      );

      tl.call(() => {
        const [front, ...rest] = order.current;
        order.current = [...rest, front];
      });
    };

    // Start with first swap after a short delay to let cards settle
    const initialTimeout = setTimeout(swap, 100);
    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover) {
      const node = container.current;
      if (!node) return;

      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
        clearTimeout(initialTimeout);
        tlRef.current?.kill();
      };
    }
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(initialTimeout);
      tlRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, config]);

  const rendered = childArr.map((child, i) => {
    if (!isValidElement(child)) return child;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = child as React.ReactElement<any>;
    return cloneElement(element, {
      key: i,
      ref: refs[i],
      style: { width, height, ...(element.props.style ?? {}) },
      onClick: (e: React.MouseEvent) => {
        element.props.onClick?.(e);
        onCardClick?.(i);
      }
    });
  });

  const containerStyle: CSSProperties = {
    position: 'relative',
    width,
    height,
    perspective: '900px',
    overflow: 'visible'
  };

  // Note: @media queries in inline styles don't actually work in React
  // This object is kept for backwards compatibility but media queries are ignored
  const mobileContainerStyle = {
    ...containerStyle,
    '@media (maxWidth: 768px)': {
      transform: 'scale(0.75) translate(25%, 25%)'
    },
    '@media (maxWidth: 480px)': {
      transform: 'scale(0.55) translate(25%, 25%)'
    }
  } as React.CSSProperties;

  return (
    <div ref={container} style={mobileContainerStyle}>
      {rendered}
    </div>
  );
};

export default CardSwap;
