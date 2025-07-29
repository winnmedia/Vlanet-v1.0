import dynamic from 'next/dynamic';

const FeedbackAll.test = dynamic(() => import('./FeedbackAll.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default FeedbackAll.test;