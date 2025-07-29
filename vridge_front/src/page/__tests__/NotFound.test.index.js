import dynamic from 'next/dynamic';

const NotFound.test = dynamic(() => import('./NotFound.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default NotFound.test;