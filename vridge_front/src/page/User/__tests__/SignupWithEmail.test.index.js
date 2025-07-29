import dynamic from 'next/dynamic';

const SignupWithEmail.test = dynamic(() => import('./SignupWithEmail.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default SignupWithEmail.test;