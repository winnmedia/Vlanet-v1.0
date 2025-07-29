import dynamic from 'next/dynamic';

const FrameworkManagement.test = dynamic(() => import('./FrameworkManagement.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default FrameworkManagement.test;