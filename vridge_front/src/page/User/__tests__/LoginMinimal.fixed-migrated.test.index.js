import dynamic from 'next/dynamic';

const LoginMinimal.fixed-migrated.test = dynamic(() => import('./LoginMinimal.fixed-migrated.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default LoginMinimal.fixed-migrated.test;