import dynamic from 'next/dynamic';

const Privacy.test = dynamic(() => import('./Privacy.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default Privacy.test;