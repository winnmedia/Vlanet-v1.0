import dynamic from 'next/dynamic';

const VideoPlanningMinimal.test = dynamic(() => import('./VideoPlanningMinimal.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default VideoPlanningMinimal.test;