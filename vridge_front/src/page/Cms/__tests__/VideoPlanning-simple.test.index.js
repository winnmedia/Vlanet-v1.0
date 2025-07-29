import dynamic from 'next/dynamic';

const VideoPlanning-simple.test = dynamic(() => import('./VideoPlanning-simple.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default VideoPlanning-simple.test;