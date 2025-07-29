import dynamic from 'next/dynamic';

const FeedbackPolling.test = dynamic(() => import('./FeedbackPolling.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default FeedbackPolling.test;