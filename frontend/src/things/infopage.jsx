const InfoPage = ({ user, authReady, authError, signInContainerRef, onLogout }) => {
  return (
    <div className="h-fit p-4  md:p-6 max-w-2xl">
      <div
        id="heading"
        className="flex flex-col gap-4"
      >
        <h1 className="text-6xl text-center font-extrabold leading-snug">
          DAYDEX
          <span className="block text-3xl md:text-5xl mt-1">
            Built to simplify tracking your progress
          </span>
        </h1>

        <div className="space-y-3 text-center text-base md:text-lg">
          <p>
            <span className="font-semibold">DAYDEX</span> helps storing your memories in a simple format
            <span className="block text-xs md:text-sm opacity-70 mt-1">
              NOTE: Still in building phase. Check dev logs for more.
            </span>
          </p>
          <p className="font-medium">
            Click on any day to assign notes and mood colors.
          </p>
          <div className="rounded-2xl border border-base-300 bg-base-100/70 p-4 text-left shadow-sm">
            <div className="text-sm uppercase tracking-[0.3em] opacity-60">Cloud Sync</div>
            {user ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm md:text-base">
                  Signed in as <span className="font-semibold">{user.name || user.email}</span>
                </p>
                <button onClick={onLogout} className="btn btn-sm bg-base-200">
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm md:text-base">
                  Sign in with Google to keep your moods available on the cloud.
                </p>
                <div
                  ref={signInContainerRef}
                  className="min-h-10 overflow-hidden rounded-xl"
                />
                {!authReady && (
                  <p className="text-xs opacity-60">Loading Google sign-in...</p>
                )}
                {authError && (
                  <p className="text-sm text-error">{authError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;
