import dynamic from 'next/dynamic';

const FeedbackStable.test = dynamic(() => import('./FeedbackStable.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default FeedbackStable.test;