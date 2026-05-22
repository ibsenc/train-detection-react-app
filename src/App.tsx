import StatsPanel from './components/StatsPanel';
import LatestTrain from './components/LatestTrain';
import DetectionChart from './components/DetectionChart';
import TimeRangeQuery from './components/TimeRangeQuery';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-icon">🚂 ✨</span>
          <div className="header-text">
            <h1>Overnight Train Dashboard</h1>
            <div className="header-subtitles">
              <p className="header-subtitle">
                Overnight recordings (11PM - 7AM) · Old Town, Tacoma
                <span className="header-dot">·</span>
              </p>
              <p className="header-subtitle2">
                Recording device positioned indoors on 30th Street, 2 blocks down from McCarver Street railroad crossing.
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <StatsPanel />
        <div className="main-grid">
          <LatestTrain />
          <DetectionChart />
        </div>
        <TimeRangeQuery />
      </main>
    </div>
  );
}

export default App;
