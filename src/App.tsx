import { useState } from 'react';
import StatsPanel from './components/StatsPanel';
import LatestTrain from './components/LatestTrain';
import DetectionChart from './components/DetectionChart';
import TimeRangeQuery from './components/TimeRangeQuery';
import GlobalTimeRange, { makePresetRange } from './components/GlobalTimeRange';
import type { TimeRange } from './components/GlobalTimeRange';
import './App.css';

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>(() => makePresetRange('7d'));
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <img src="/train-icon.png" alt="" className="header-icon" />
          <div className="header-text">
            <h1>Midnight Train</h1>
            <p className="header-tagline">Train Detection Dashboard</p>
            <div className="header-subtitles">
              <p className="header-subtitle">
                Overnight recordings (11PM - 7AM) · Old Town, Tacoma
              </p>
              <p className="header-subtitle2">
                Recorded indoors on 30th St, 2 blocks from McCarver Street crossing.
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <GlobalTimeRange value={timeRange} onChange={setTimeRange} />
        <StatsPanel start={timeRange.start} end={timeRange.end} />
        <div className="main-grid">
          <LatestTrain />
          <DetectionChart start={timeRange.start} end={timeRange.end} />
        </div>
        <TimeRangeQuery start={timeRange.start} end={timeRange.end} />
      </main>
      <footer className="app-footer">
        <p className="footer-credit">Created by Camille Ibsen</p>
        <div className="footer-links">
          <a href="https://github.com/ibsenc" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="footer-sep">·</span>
          <a href="https://www.linkedin.com/in/camille-ibsen/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
        <p className="footer-copy">© 2026 Midnight Train</p>
      </footer>
    </div>
  );
}

export default App;
