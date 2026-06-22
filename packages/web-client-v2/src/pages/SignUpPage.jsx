import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

// Password must meet Cognito's default policy: length, case, digit, symbol
const validatePassword = (pw) => {
  if (pw.length < 8) return 'Must be at least 8 characters';
  if (!/[a-z]/.test(pw)) return 'Must include a lowercase letter';
  if (!/[A-Z]/.test(pw)) return 'Must include an uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Must include a number';
  if (!/[^a-zA-Z0-9]/.test(pw)) return 'Must include a symbol';
  return null;
};

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const passwordError = password.length > 0 ? validatePassword(password) : null;
  const passwordValid = password.length > 0 && !passwordError;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const nameValid = name.length > 0 && name.length <= 20;
  const canSubmit = email && nameValid && passwordValid && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try { await signUp(email, password, name); setSuccess(true); }
    catch (err) {
      if (err.name === 'UsernameExistsException') setError('An account with this email already exists');
      else setError(err.message || 'Sign up failed');
    } finally { setIsSubmitting(false); }
  };

  // Google is a federated flow: the same call signs in OR creates the account on
  // first use, so "sign up with Google" and "sign in with Google" are identical.
  // On failure the OAuth round-trip lands back on /login, which surfaces the
  // message; a synchronous failure here is shown inline.
  const handleGoogleSignIn = async () => {
    setError(null);
    try { await signInWithGoogle(); } catch (err) { setError(err.message || 'Google sign up failed'); }
  };

  // Show pending-approval confirmation after successful registration
  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center text-center px-8">
        <div className="w-[84px] h-[84px] rounded-full border-2 border-sage grid place-items-center mb-6 text-sage font-body font-extrabold text-[44px]">✓</div>
        <h1 className="font-hand font-bold text-[52px] leading-none m-0">Account<br />created</h1>
        <p className="text-chalk-dim text-sm leading-relaxed max-w-[250px] my-3 mb-7">
          Your registration is pending approval. An administrator will review your request.
        </p>
        <Link to="/login" className="w-full max-w-[240px]"><Button variant="ghost">Back to sign in</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col justify-start pt-12 pb-8 px-8">
      <div className="w-[62px] h-[62px] rounded-full border-2 border-dashed border-coral grid place-items-center mb-4 text-mustard">
        <Icon name="meal" className="w-[64%] h-[64%]" />
      </div>
      <h1 className="font-hand font-bold text-[46px] leading-[0.86] m-0 mb-5">Create<br />account</h1>

      {error && <div className="mb-3 text-red text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <Field label="Email" type="email" value={email} autoComplete="email" autoCapitalize="none" autoFocus
               disabled={isSubmitting} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Name" value={name} maxLength={20} count={`${name.length} / 20`} autoCapitalize="words"
               disabled={isSubmitting} onChange={(e) => setName(e.target.value)} />
        <Field label="Password" type="password" value={password} autoComplete="new-password" autoCapitalize="none"
               disabled={isSubmitting} onChange={(e) => setPassword(e.target.value)}
               help={password.length > 0 ? (passwordError ? `✕ ${passwordError}` : '✓ strong — meets all requirements') : undefined}
               helpTone={passwordError ? 'bad' : 'ok'} />
        <Field label="Confirm password" type="password" value={confirmPassword} autoComplete="new-password" autoCapitalize="none"
               disabled={isSubmitting} onChange={(e) => setConfirmPassword(e.target.value)}
               help={confirmPassword.length > 0 ? (passwordsMatch ? '✓ passwords match' : '✕ passwords do not match') : undefined}
               helpTone={passwordsMatch ? 'ok' : 'bad'} />
        <Button type="submit" className="mt-2.5" disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? <Spinner /> : 'Create account'}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-chalk-faint text-[11px] tracking-[0.2em] uppercase my-4 before:flex-1 before:border-b before:border-dashed before:border-chalk-faint after:flex-1 after:border-b after:border-dashed after:border-chalk-faint">or</div>
      <Button variant="ghost" onClick={handleGoogleSignIn} disabled={isSubmitting} className="flex items-center justify-center gap-2">
        <Icon name="google" className="w-[18px] h-[18px]" />Continue with Google
      </Button>

      <div className="text-center mt-4 text-[12.5px] text-chalk-dim">
        Already have an account? <Link to="/login" className="text-coral font-semibold no-underline">Sign in</Link>
      </div>
    </div>
  );
};

export default SignUpPage;
