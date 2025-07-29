import dynamic from 'next/dynamic';

const ProjectView-fixed.test = dynamic(() => import('./ProjectView-fixed.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default ProjectView-fixed.test;