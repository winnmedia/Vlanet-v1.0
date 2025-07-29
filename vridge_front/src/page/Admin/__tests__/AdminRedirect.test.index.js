import dynamic from 'next/dynamic';

const AdminRedirect.test = dynamic(() => import('./AdminRedirect.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default AdminRedirect.test;