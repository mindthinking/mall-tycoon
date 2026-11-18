export function Splash({ ready = false, onStart }: { ready?: boolean; onStart?: () => void }) {
  return (
    <main className="boot">
      <img className="cover-floor" src="/art/cover-floor.jpg" alt="" />
      <header className="cover-head">
        <h1>商場大亨</h1>
      </header>
      <img className="splash-host" src="/art/host.png?v=ting6" alt="霆總" />
      <button type="button" className="btn-primary" disabled={!ready} onClick={onStart}>
        開始經營
      </button>
    </main>
  );
}