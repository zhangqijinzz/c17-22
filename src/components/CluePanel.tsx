import { useState } from 'react';
import type { StoryClue, StoryScene } from '../models/story';
import type { StoryViewModel } from '../viewmodels/storyViewModel';
import { Highlight } from './Highlight';
import { useFocusFlash, type FocusRequest } from './useFocusFlash';

interface CluePanelProps {
  viewModel: StoryViewModel;
  scenes: StoryScene[];
  keyword: string;
  focusRequest: FocusRequest | null;
}

interface ClueRowProps {
  clue: StoryClue;
  scenes: StoryScene[];
  keyword: string;
  focusRequest: FocusRequest | null;
}

function ClueRow({ clue, scenes, keyword, focusRequest }: ClueRowProps) {
  const ref = useFocusFlash(focusRequest, 'clue', clue.id);
  const setupTitle = scenes.find((scene) => scene.id === clue.setupSceneId)?.title ?? '未知场景';
  const payoffTitle = clue.payoffSceneId ? scenes.find((scene) => scene.id === clue.payoffSceneId)?.title : undefined;
  return (
    <div className="clue-row" ref={ref}>
      <span className="clue-symbol">⌁</span>
      <div>
        <strong><Highlight text={clue.title} keyword={keyword} /></strong>
        <span>{setupTitle} <b>→</b> {payoffTitle ?? '待回收'}</span>
      </div>
      <em className={clue.payoffSceneId ? 'resolved' : ''}>{clue.payoffSceneId ? '已回收' : '未回收'}</em>
    </div>
  );
}

export function CluePanel({ viewModel, scenes, keyword, focusRequest }: CluePanelProps) {
  const [title, setTitle] = useState('');
  const [setup, setSetup] = useState(scenes[0]?.id ?? '');
  const [payoff, setPayoff] = useState('');
  const story = viewModel.snapshot.story;
  const submit = () => { viewModel.addClue(title, setup, payoff); setTitle(''); };
  return (
    <section className="panel clue-panel">
      <div className="panel-heading"><div><span className="eyebrow">THREADS / 叙事线索</span><h2>伏笔关系</h2></div><span className="unresolved"><i /> {viewModel.snapshot.stats.unresolvedClues} 个待回收</span></div>
      <div className="clue-list">
        {story?.clues.map((clue) => <ClueRow key={clue.id} clue={clue} scenes={scenes} keyword={keyword} focusRequest={focusRequest} />)}
        {story?.clues.length === 0 && <div className="empty-inline">还没有伏笔，埋下第一条叙事线索。</div>}
      </div>
      <div className="clue-form"><input aria-label="伏笔名称" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="伏笔名称，例如：罗盘上的刻痕" /><select aria-label="埋下场景" value={setup} onChange={(event) => setSetup(event.target.value)}><option value="">埋下场景…</option>{scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.title}</option>)}</select><select aria-label="回收场景" value={payoff} onChange={(event) => setPayoff(event.target.value)}><option value="">回收场景（稍后）</option>{scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.title}</option>)}</select><button onClick={submit}>建立关系</button></div>
    </section>
  );
}
