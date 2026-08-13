import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { signIn, signInWithGoogle, oauthMessage, clearOauthMessage, error: authError } = useAuth();
  const displayError = error || authError;

  useEffect(() => {
    if (oauthMessage) {
      if (oauthMessage.type === 'success') { setSuccessMessage(oauthMessage.text); setError(null); }
      else { setError(oauthMessage.text); setSuccessMessage(null); }
      clearOauthMessage();
    }
  }, [oauthMessage, clearOauthMessage]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try { await signInWithGoogle(); } catch (err) { setError(err.message || 'Google sign in failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try { await signIn(username, password); }
    catch (err) { setError(err.message || err.name || 'Failed to sign in'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center px-8">
      <div className="w-[84px] h-[84px] rounded-full border-2 border-dashed border-coral grid place-items-center mb-6 text-mustard">
        <Icon name="meal" className="w-[64%] h-[64%]" />
      </div>
      <h1 className="font-hand font-bold text-[60px] leading-[0.86] m-0 mb-7">Meal<br />Planner</h1>

      {successMessage && <div className="mb-3 text-sage text-sm">{successMessage}</div>}
      {displayError && <div className="mb-3 text-red text-sm">{displayError}</div>}

      {/* Google is a federated flow that both signs in AND registers on first
          use. It lives ABOVE the email split so it reads as the universal entry
          point — filing it beside "Sign in" would wrongly imply it's for
          returning users only. */}
      <Button variant="ghost" onClick={handleGoogleSignIn} disabled={isSubmitting} className="flex items-center justify-center gap-2">
        <Icon name="google" className="w-[18px] h-[18px]" />Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-chalk-dim text-[11px] tracking-[0.2em] uppercase my-5 before:flex-1 before:border-b before:border-dashed before:border-chalk-faint after:flex-1 after:border-b after:border-dashed after:border-chalk-faint">or with email</div>

      <form onSubmit={handleSubmit}>
        <Field label="Email" type="email" value={username} autoComplete="email" autoCapitalize="none"
               disabled={isSubmitting} onChange={(e) => setUsername(e.target.value)} />
        <Field label="Password" type={showPassword ? 'text' : 'password'} value={password} autoComplete="current-password" autoCapitalize="none"
               disabled={isSubmitting} onChange={(e) => setPassword(e.target.value)}
               rightSlot={
                 <button type="button" onClick={() => setShowPassword((v) => !v)}
                   aria-label={showPassword ? 'Hide password' : 'Show password'}
                   className="flex-none text-chalk-dim hover:text-chalk active:scale-90 transition p-1 -mr-1">
                   <Icon name={showPassword ? 'eye' : 'eye-off'} className="w-[18px] h-[18px]" />
                 </button>
               } />
        <Button type="submit" className="mt-2.5" disabled={isSubmitting || !username || !password}>
          {isSubmitting ? <Spinner inline /> : 'Sign in'}
        </Button>
      </form>

      {/* The two email-only states, both as first-class actions: Sign in
          (returning) above, Create account (new) here. Coral text ties this to
          the brand's "join" accent and separates it from the neutral Google
          ghost at the top. */}
      <Link to="/signup" className="block mt-3">
        <Button variant="ghost" disabled={isSubmitting} className="text-coral! hover:brightness-110">
          Create account
        </Button>
      </Link>
    </div>
  );
};

export default LoginPage;
