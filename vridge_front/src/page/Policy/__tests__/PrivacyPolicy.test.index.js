import dynamic from 'next/dynamic';

const PrivacyPolicy.test = dynamic(() => import('./PrivacyPolicy.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default PrivacyPolicy.test;