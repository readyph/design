import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useDirtyGuard } from './DirtyGuard';
import { Button } from './Button';

function Demo({ dirty }: { dirty: boolean }) {
  const [left, setLeft] = useState(false);
  const { guard, node } = useDirtyGuard(dirty);
  return (
    <div className="grid gap-3 p-4">
      <Button variant="secondary" onClick={() => guard(() => setLeft(true))}>Leave this sheet</Button>
      {left && <p role="status">Left the sheet.</p>}
      {node}
    </div>
  );
}
const meta: Meta<typeof Demo> = { title: 'Components/SMS/Dirty guard', component: Demo, tags: ['autodocs'], args: { dirty: true } };
export default meta;
type S = StoryObj<typeof Demo>;

export const Edited: S = {};
export const Clean: S = { args: { dirty: false } };
