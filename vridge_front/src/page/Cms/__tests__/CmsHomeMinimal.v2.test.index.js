import dynamic from 'next/dynamic';

const CmsHomeMinimal.v2.test = dynamic(() => import('./CmsHomeMinimal.v2.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default CmsHomeMinimal.v2.test;