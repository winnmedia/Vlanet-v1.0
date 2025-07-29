import dynamic from 'next/dynamic';

const LoginMinimal.test = dynamic(() => import('./LoginMinimal.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default LoginMinimal.test;