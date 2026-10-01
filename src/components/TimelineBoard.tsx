import { useState } from 'react';
import type { StoryDocument, StoryScene } from '../models/story';
import type { StoryViewModel } from '../viewmodels/storyViewModel';
import { Highlight } from './Highlight';
import { useFocusFlash, type FocusRequest } from './useFocusFlash';

interface TimelineBoardProps {
  viewModel: StoryViewModel;
  scenes: StoryScene[];
  keyword: string;
  focusRequest: FocusRequest | null;
}

interface SceneNodeProps {
  viewModel: StoryViewModel;
  story: StoryDocument;
  scene: StoryScene;
  index: number;
  keyword: string;
  focusRequest: FocusRequest | null;
}

function SceneNode({ viewModel, story, scene, index, keyword, focusRequest }: SceneNodeProps) {
  const selected = story.selectedSceneId === scene.id;
  const characterCount = story.characters.filter((character) => scene.characterIds.includes(character.id)).length;
  const ref = useFocusFlash(focusRequest, 'scene', scene.id);
  const displayIndex = String(index + 1).padStart(2, '0');
  return (
    <button className={selected ? 'scene-node selected' : 'scene-node'} key={scene.id} onClick={() => viewModel.selectScene(scene.id)}>
      <span className="scene-index">{displayIndex}</span>
      <span className="scene-line" />
      <span className="scene-dot" />
      <div className="scene-copy" ref={ref}>
        <span className="scene-meta">SCENE {displayIndex} · {characterCount} 位人物</span>
        <strong><Highlight text={scene.title} keyword={keyword} /></strong>
        <span><Highlight text={scene.summary} keyword={keyword} /></span>
        <div className="scene-tags">
          {scene.conflict && <em>冲突</em>}
          {scene.clueIds.length > 0 && <em className="clue-tag">伏笔 {scene.clueIds.length}</em>}
        </div>
      </div>
    </button>
  );
}

export function TimelineBoard({ viewModel, scenes, keyword, focusRequest }: TimelineBoardProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const submit = () => { viewModel.addScene(title, summary); setTitle(''); setSummary(''); };
  const story = viewModel.snapshot.story;
  return (
    <section className="panel timeline-panel">
      <div className="panel-heading timeline-heading"><div><span className="eyebrow">SEQUENCE / 时间结构</span><h2>故事时间线</h2></div><div className="timeline-actions"><span className="hint">拖动感受节奏 · 点击编辑详情</span><button className="secondary-button" onClick={submit}>＋ 新建场景</button></div></div>
      {viewModel.timelineWarning && <div className="warning-banner">△ {viewModel.timelineWarning}</div>}
      <div className="timeline-rail">
        {scenes.map((scene, index) => story && <SceneNode key={scene.id} viewModel={viewModel} story={story} scene={scene} index={index} keyword={keyword} focusRequest={focusRequest} />)}
        {scenes.length === 0 && <div className="empty-state">时间线还没有场景。创建第一幕，让故事开始移动。</div>}
      </div>
      <div className="create-scene-row"><input aria-label="场景标题" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="新场景标题，例如：灯塔停电" /><input aria-label="场景摘要" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="一句话写下这一幕发生了什么" /><button onClick={submit}>添加到时间线</button></div>
    </section>
  );
}
