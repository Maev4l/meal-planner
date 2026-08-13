import Button from './ui/Button';

// A failed load, with a way out. Every load error in the product used to be a bare
// red line — no cause, and nothing to press except the browser's back button.
const ErrorState = ({ message, onRetry, retryLabel = 'Try again' }) => (
  <div className="py-7 flex flex-col items-center text-center">
    <p className="m-0 mb-4 max-w-[260px] text-red text-sm leading-relaxed">{message}</p>
    {onRetry && (
      <div className="w-full max-w-[200px]">
        <Button variant="ghost" onClick={onRetry}>{retryLabel}</Button>
      </div>
    )}
  </div>
);

export default ErrorState;
