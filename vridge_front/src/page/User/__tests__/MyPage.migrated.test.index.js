import dynamic from 'next/dynamic';

const MyPage.migrated.test = dynamic(() => import('./MyPage.migrated.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default MyPage.migrated.test;