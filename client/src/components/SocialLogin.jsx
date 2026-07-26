import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Social sign-in options. Each button calls `onToken(provider, token)`; the parent
 * exchanges the token with the backend. Buttons degrade gracefully when a provider
 * is not configured via its Vite env var.
 */
function SocialLogin({ onToken, onError, disabled }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          or continue with
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-3 space-y-3">
        {/* Google */}
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
              <GoogleLogin
                onSuccess={(cr) => onToken('google', cr.credential)}
                onError={() => onError?.('Google login failed.')}
                width="320"
                text="continue_with"
              />
            </div>
          </GoogleOAuthProvider>
        ) : (
          <button
            type="button"
            disabled
            title="Set VITE_GOOGLE_CLIENT_ID to enable"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            <span aria-hidden>🔒</span> Continue with Google (not configured)
          </button>
        )}
      </div>
    </div>
  )
}

export default SocialLogin
