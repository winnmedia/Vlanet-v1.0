import dynamic from 'next/dynamic';

const AdminDashboard.test = dynamic(() => import('./AdminDashboard.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default AdminDashboard.test;