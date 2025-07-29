import dynamic from 'next/dynamic';

const InvitationAccept.test = dynamic(() => import('./InvitationAccept.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default InvitationAccept.test;