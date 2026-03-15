type QuickLogProps = {
  handleLog: (type: string, value: string) => void;
}

export default function QuickLog({ handleLog }: QuickLogProps) {
  return (
    <div className="content-card quick-log-card">
      <h2 className="card-title">Quick Log</h2>
      <p className="card-subtitle">Record today&apos;s activities</p>

      <div className="log-categories">
        <div className="log-category">
          <h3 className="category-title">Mood</h3>
          <div className="log-buttons">
            <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'happy')}>
              <span className="emoji">😊</span>
              <span>Happy</span>
            </button>
            <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'calm')}>
              <span className="emoji">😌</span>
              <span>Calm</span>
            </button>
            <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'energetic')}>
              <span className="emoji">⚡</span>
              <span>Energetic</span>
            </button>
            <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'neutral')}>
              <span className="emoji">😐</span>
              <span>Neutral</span>
            </button>
          </div>
        </div>

        <div className="log-category">
          <h3 className="category-title">Speech</h3>
          <div className="log-buttons">
            <button className="log-btn speech-btn" onClick={() => handleLog('speech', 'verbal')}>
              <span className="emoji">🗣️</span>
              <span>Verbal</span>
            </button>
            <button className="log-btn speech-btn" onClick={() => handleLog('speech', 'attempted')}>
              <span className="emoji">🎯</span>
              <span>Attempted</span>
            </button>
            <button className="log-btn speech-btn" onClick={() => handleLog('speech', 'gesture')}>
              <span className="emoji">👋</span>
              <span>Gesture</span>
            </button>
          </div>
        </div>

        <div className="log-category">
          <h3 className="category-title">Therapy</h3>
          <div className="log-buttons">
            <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'ot')}>
              <span className="emoji">🎨</span>
              <span>OT</span>
            </button>
            <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'speech')}>
              <span className="emoji">🩺</span>
              <span>Speech</span>
            </button>
            <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'aba')}>
              <span className="emoji">🧩</span>
              <span>ABA</span>
            </button>
            <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'play')}>
              <span className="emoji">🎮</span>
              <span>Play</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
