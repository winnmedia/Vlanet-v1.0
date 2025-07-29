import dynamic from 'next/dynamic';

const LoginMinimal.v2.test = dynamic(() => import('./LoginMinimal.v2.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default LoginMinimal.v2.test;