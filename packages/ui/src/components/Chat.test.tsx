import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chat } from './Chat';

describe('Chat size', () => {
  it('fill takes the parent size with no border, radius or shadow', () => {
    render(<Chat size="fill" aria-label="chat" />);
    const cls = screen.getByLabelText('chat').className;
    expect(cls).toContain('h-full');
    expect(cls).toContain('w-full');
    expect(cls).not.toMatch(/\bborder\b/);
    expect(cls).not.toMatch(/\brounded/);
    expect(cls).not.toMatch(/\bshadow/);
  });

  it('keeps the chrome and fixed size on the other sizes', () => {
    render(<Chat size="md" aria-label="chat" />);
    const cls = screen.getByLabelText('chat').className;
    expect(cls).toContain('border');
    expect(cls).toContain('rounded-lg');
    expect(cls).toContain('shadow-lg');
    expect(cls).toContain('w-96');
  });
});
