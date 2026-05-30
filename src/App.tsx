import { useEffect, useRef, useState } from 'react';
import StatsPanel from './components/StatsPanel';
import LatestTrain from './components/LatestTrain';
import DetectionChart from './components/DetectionChart';
import TimeRangeQuery from './components/TimeRangeQuery';
import GlobalTimeRange, { makePresetRange } from './components/GlobalTimeRange';
import type { TimeRange } from './components/GlobalTimeRange';
import './App.css';

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>(() => makePresetRange('7d'));
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const headerCollapsedRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 860px)');
    let rafId: number | null = null;

    const applyCollapsedState = (nextCollapsed: boolean) => {
      if (headerCollapsedRef.current !== nextCollapsed) {
        headerCollapsedRef.current = nextCollapsed;
        setIsHeaderCollapsed(nextCollapsed);
      }
    };

    const updateHeaderState = () => {
      if (!mediaQuery.matches) {
        applyCollapsedState(false);
        return;
      }

      // Collapse on any non-zero scroll offset; only fully expand at top.
      applyCollapsedState(window.scrollY > 0);
    };

    const scheduleHeaderUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateHeaderState();
      });
    };

    updateHeaderState();
    window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });
    mediaQuery.addEventListener('change', updateHeaderState);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleHeaderUpdate);
      mediaQuery.removeEventListener('change', updateHeaderState);
    };
  }, []);

  return (
    <div className="app">
      <header className={`app-header${isHeaderCollapsed ? ' app-header--collapsed' : ''}`}>
        <div className="header-inner">
          <div className="header-title-row">
            <img src="/train-icon.png" alt="" className="header-icon" />
            <div className="header-title-text">
              <h1>Midnight Train</h1>
              <p className="header-tagline">Train Detection Dashboard</p>
            </div>
          </div>
          <div className="header-subtitles">
            <p className="header-subtitle">
              Overnight recordings (11PM - 7AM) · Old Town, Tacoma
            </p>
            <p className="header-subtitle2">
              Recorded indoors on 30th St, 2 blocks from McCarver St crossing.
            </p>
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
