import dynamic from 'next/dynamic';

const EmailMonitor.test = dynamic(() => import('./EmailMonitor.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default EmailMonitor.test;