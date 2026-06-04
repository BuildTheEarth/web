'use client';

import dynamic from 'next/dynamic';

const LottieAnimation = dynamic(() => import('lottie-react'), { ssr: false });

export default LottieAnimation;
