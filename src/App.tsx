import { useCallback, useRef, useState } from 'react';
import { CharacterPanel } from './components/CharacterPanel';
import { CluePanel } from './components/CluePanel';
import { SceneInspector } from './components/SceneInspector';
import { SearchBox } from './components/SearchBox';
import { Sidebar } from './components/Sidebar';
import { TimelineBoard } from './components/TimelineBoard';
import type { FocusRequest } from './components/useFocusFlash';
import { useStoryViewModel } from './hooks/useStoryViewModel';
import type { StorySearchResult } from './models/storySearch';

function App() {
  const viewModel = useStoryViewModel();
  const snapshot = viewModel.snapshot;
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const focusNonce = useRef(0);

  const handlePick = useCallback((result: StorySearchResult) => {
    // 冲突结果挂在场景上，先把场景切出来再滚动到冲突字段
    if ((result.category === 'scene' || result.category === 'conflict') && viewModel.selectedScene?.id !== result.ownerId) {
      viewModel.selectScene(result.ownerId);
    }
    focusNonce.current += 1;
    setFocusRequest({ category: result.category, ownerId: result.ownerId, nonce: focusNonce.current });
  }, [viewModel]);

  if (snapshot.status === 'loading' || !snapshot.story) return <div className="app-loading"><span className="brand-mark">✦</span><p>正在打开故事工作台…</p></div>;
  const sectionLabel = snapshot.activeSection === 'characters' ? '人物关系' : snapshot.activeSection === 'clues' ? '伏笔关系' : '故事总览';
  const scenes = viewModel.orderedScenes;
  const searchResults = viewModel.searchResults;
  return (
    <div className="app-shell">
      <Sidebar viewModel={viewModel} stats={snapshot.stats} />
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">STORY LAB / {sectionLabel}</span>
            <h1>{snapshot.story.title}</h1>
          </div>
          <div className="topbar-actions">
            <SearchBox query={snapshot.search} results={searchResults} onCommit={viewModel.setSearch} onPick={handlePick} />
            <button className="complete-button" onClick={() => viewModel.completeProject()}>{snapshot.status === 'completed' ? '✓ 已完成' : '标记完成'}</button>
          </div>
        </header>
        <div className="content-wrap">
          {snapshot.notice && <div className="notice" role="status">✦ {snapshot.notice}</div>}
          {snapshot.error && <div className="error-banner" role="alert">{snapshot.error} <button onClick={() => viewModel.resetProject()}>恢复示例</button></div>}
          <div className="stats-row">
            <div><span>人物</span><strong>{snapshot.stats.characters}</strong></div>
            <div><span>场景</span><strong>{snapshot.stats.scenes}</strong></div>
            <div><span>伏笔</span><strong>{snapshot.stats.clues}</strong></div>
            <div className={snapshot.stats.unresolvedClues > 0 ? 'stat-alert' : ''}><span>待回收</span><strong>{snapshot.stats.unresolvedClues}</strong></div>
            <div className="completion-stat"><span>结构完成度</span><strong>{snapshot.stats.completion}%</strong><div className="progress-track"><span style={{ width: `${snapshot.stats.completion}%` }} /></div></div>
          </div>
          <div className="work-grid">
            <div className="workspace-column">
              <TimelineBoard viewModel={viewModel} scenes={scenes} keyword={snapshot.search} focusRequest={focusRequest} />
              <div className="lower-grid">
                <CharacterPanel viewModel={viewModel} characters={viewModel.orderedCharacters} keyword={snapshot.search} focusRequest={focusRequest} />
                <CluePanel viewModel={viewModel} scenes={scenes} keyword={snapshot.search} focusRequest={focusRequest} />
              </div>
            </div>
            <SceneInspector viewModel={viewModel} scene={viewModel.selectedScene} characters={snapshot.story.characters} focusRequest={focusRequest} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
