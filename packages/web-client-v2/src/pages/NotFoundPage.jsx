import { useNavigate } from 'react-router-dom';
import TopBar from '../components/ui/TopBar';
import ErrorState from '../components/ErrorState';

// Any unmatched route. Previously these rendered the app shell with an empty body
// and no explanation — reachable from a stale bookmark or a removed route such as
// the old /groups/:id/comments.
const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div>
      <TopBar title="Not found" />
      <div className="px-5">
        <ErrorState
          message="That page isn't here. It may have moved, or the link may be out of date."
          retryLabel="Go to your groups"
          onRetry={() => navigate('/', { replace: true })}
        />
      </div>
    </div>
  );
};

export default NotFoundPage;
