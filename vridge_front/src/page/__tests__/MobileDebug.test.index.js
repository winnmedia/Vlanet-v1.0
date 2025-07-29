import dynamic from 'next/dynamic';

const MobileDebug.test = dynamic(() => import('./MobileDebug.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default MobileDebug.test;