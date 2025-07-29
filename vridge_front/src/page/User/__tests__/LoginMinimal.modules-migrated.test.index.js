import dynamic from 'next/dynamic';

const LoginMinimal.modules-migrated.test = dynamic(() => import('./LoginMinimal.modules-migrated.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default LoginMinimal.modules-migrated.test;