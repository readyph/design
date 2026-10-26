import { useState } from 'react';
import { BlockedQuestions, type BlockedQuestionItem, type BlockedQuestionsProps } from './BlockedQuestions';
import { items as sampleItems, replies as sampleReplies, scopes as sampleScopes } from './BlockedQuestions.data';

/** Stateful demo wrapper for stories; not exported from the package. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Live(props: Partial<BlockedQuestionsProps> & { initial?: BlockedQuestionItem[]; ms?: number }) {
  const { initial = sampleItems, ms = 150, ...rest } = props;
  const [items, setItems] = useState(initial);
  const [replies, setReplies] = useState(sampleReplies);
  return (
    <BlockedQuestions
      items={items}
      scopes={sampleScopes}
      replies={replies}
      onBlock={async (i) => {
        await wait(ms);
        setItems((x) => [...x, { id: `n${Date.now()}`, ...i }]);
      }}
      onRemove={async (item, { undo }) => {
        await wait(ms);
        setItems((x) => (undo ? [item, ...x] : x.filter((y) => y.id !== item.id)));
      }}
      onEditReply={async (s, t) => {
        await wait(ms);
        setReplies((r) => ({ ...r, [s]: t }));
      }}
      onTry={() => {}}
      {...rest}
    />
  );
}

