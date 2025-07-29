import dynamic from 'next/dynamic';

const VideoPlanning-working.test = dynamic(() => import('./VideoPlanning-working.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default VideoPlanning-working.test;