import dynamic from 'next/dynamic';

const CmsHomeMinimal.test = dynamic(() => import('./CmsHomeMinimal.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default CmsHomeMinimal.test;