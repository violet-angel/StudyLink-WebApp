import { Navigate } from 'react-router-dom';

function Library() {
  return <Navigate to="/learning?view=library" replace />;
}

export default Library;
