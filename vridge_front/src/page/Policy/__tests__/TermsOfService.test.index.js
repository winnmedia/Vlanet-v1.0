import dynamic from 'next/dynamic';

const TermsOfService.test = dynamic(() => import('./TermsOfService.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default TermsOfService.test;