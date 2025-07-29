import dynamic from 'next/dynamic';

const ProjectCreateDebug.test = dynamic(() => import('./ProjectCreateDebug.test'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default ProjectCreateDebug.test;