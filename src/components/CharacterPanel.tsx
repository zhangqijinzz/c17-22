import { useState } from 'react';
import type { StoryCharacter } from '../models/story';
import type { StoryViewModel } from '../viewmodels/storyViewModel';
import { Highlight } from './Highlight';
import { useFocusFlash, type FocusRequest } from './useFocusFlash';

interface CharacterPanelProps {
  viewModel: StoryViewModel;
  characters: StoryCharacter[];
  keyword: string;
  focusRequest: FocusRequest | null;
}

interface CharacterCardProps {
  character: StoryCharacter;
  keyword: string;
  focusRequest: FocusRequest | null;
}

function CharacterCard({ character, keyword, focusRequest }: CharacterCardProps) {
  const ref = useFocusFlash(focusRequest, 'character', character.id);
  return (
    <div className="character-card" ref={ref}>
      <span className={`avatar ${character.color}`}>{character.name.slice(0, 1)}</span>
      <div>
        <strong><Highlight text={character.name} keyword={keyword} /></strong>
        <span><Highlight text={character.role} keyword={keyword} /></span>
      </div>
      <i>•••</i>
    </div>
  );
}

export function CharacterPanel({ viewModel, characters, keyword, focusRequest }: CharacterPanelProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const submit = () => { viewModel.addCharacter(name, role); setName(''); setRole(''); };
  return (
    <section className="panel character-panel">
      <div className="panel-heading"><div><span className="eyebrow">CAST / 角色阵容</span><h2>人物卡</h2></div><span className="count-badge">{characters.length}</span></div>
      <div className="character-list">
        {characters.map((character) => <CharacterCard key={character.id} character={character} keyword={keyword} focusRequest={focusRequest} />)}
        {characters.length === 0 && <div className="empty-inline">还没有人物，从下方添加第一位角色。</div>}
      </div>
      <div className="inline-form"><input aria-label="人物姓名" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="人物姓名" /><input aria-label="人物身份" value={role} onChange={(event) => setRole(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="身份 / 角色弧" /><button className="icon-add" onClick={submit} aria-label="添加人物">＋</button></div>
    </section>
  );
}
