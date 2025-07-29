import dynamic from 'next/dynamic';

const Terms.test = dynamic(() => import('./Terms.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default Terms.test;