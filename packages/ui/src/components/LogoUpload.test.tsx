import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoUpload } from './LogoUpload';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const realImage = window.Image;
const realGetContext = HTMLCanvasElement.prototype.getContext;
const realToDataURL = HTMLCanvasElement.prototype.toDataURL;
let draw: ReturnType<typeof vi.fn>;
let canvas: HTMLCanvasElement | undefined;

beforeEach(() => {
  draw = vi.fn();
  // jsdom decodes no images and has no canvas: stand in for both
  class FakeImage {
    onload?: () => void;
    onerror?: () => void;
    naturalWidth = 400;
    naturalHeight = 300;
    set src(v: string) { queueMicrotask(() => (v.includes('bad') ? this.onerror?.() : this.onload?.())); }
  }
  window.Image = FakeImage as unknown as typeof Image;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) { canvas = this; return { drawImage: draw } as never; };
  HTMLCanvasElement.prototype.toDataURL = () => PNG;
});
afterEach(() => {
  cleanup();
  window.Image = realImage;
  HTMLCanvasElement.prototype.getContext = realGetContext;
  HTMLCanvasElement.prototype.toDataURL = realToDataURL;
});

const fileInput = () => document.querySelector('input[type=file]') as HTMLInputElement;
const image = (name = 'logo.png', type = 'image/png', body = 'x') => new File([body], name, { type });

function Harness({ onChange, name = 'Lakeside Dental' }: { onChange: (f: File | null) => void; name?: string }) {
  const [v, setV] = useState<string | null>(null);
  return <LogoUpload name={name} value={v} onChange={(f, url) => { setV(url); onChange(f); }} />;
}

describe('LogoUpload', () => {
  it('returns a 128x128 centre-cropped PNG file', async () => {
    const onChange = vi.fn();
    render(<LogoUpload name="Lakeside Dental" onChange={onChange} />);
    await userEvent.setup().upload(fileInput(), image('mark.jpg', 'image/jpeg'));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const [file, url] = onChange.mock.calls[0] as [File, string];
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/png');
    expect(file.name).toBe('mark.png');
    expect(url).toBe(PNG);
    expect(canvas?.width).toBe(128);
    expect(canvas?.height).toBe(128);
    // 400x300 -> a 300px square taken from the middle
    expect(draw).toHaveBeenCalledWith(expect.anything(), 50, 0, 300, 300, 0, 0, 128, 128);
    expect(screen.getByRole('status').textContent).toBe('Logo updated.');
  });

  it('rejects a wrong type without calling onChange', async () => {
    const onChange = vi.fn();
    render(<LogoUpload name="Lakeside Dental" onChange={onChange} />);
    // fireEvent-style upload that ignores `accept`
    await userEvent.setup({ applyAccept: false }).upload(fileInput(), image('doc.pdf', 'application/pdf'));
    expect((await screen.findByRole('alert')).textContent).toBe('Use a PNG, JPG or SVG image.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects an oversize file without calling onChange', async () => {
    const onChange = vi.fn();
    render(<LogoUpload name="Lakeside Dental" maxBytes={10} onChange={onChange} />);
    await userEvent.setup().upload(fileInput(), image('big.png', 'image/png', 'x'.repeat(11)));
    expect((await screen.findByRole('alert')).textContent).toMatch(/over .* MB/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects an unreadable image without calling onChange', async () => {
    const onChange = vi.fn();
    render(<LogoUpload name="Lakeside Dental" onChange={onChange} />);
    // the fake decoder fails when the data URL contains "bad"
    const f = image('x.png', 'image/png', 'bad');
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      Object.defineProperty(this, 'result', { value: 'data:bad' });
      queueMicrotask(() => this.onload?.(new ProgressEvent('load') as never));
    });
    await userEvent.setup().upload(fileInput(), f);
    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn't read/);
    expect(onChange).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('clears an error after a good file', async () => {
    const u = userEvent.setup({ applyAccept: false });
    render(<LogoUpload name="Lakeside Dental" onChange={() => {}} />);
    await u.upload(fileInput(), image('doc.pdf', 'application/pdf'));
    await screen.findByRole('alert');
    await u.upload(fileInput(), image());
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('Use the default calls onChange(null), shows the monogram and returns focus to Upload', async () => {
    const onChange = vi.fn();
    const u = userEvent.setup();
    render(<Harness onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Use the default' })).toBeNull();
    await u.upload(fileInput(), image());
    const use = await screen.findByRole('button', { name: 'Use the default' });
    await u.click(use);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('button', { name: 'Use the default' })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Upload' })));
    expect(screen.getByRole('status').textContent).toBe('Using the default logo.');
  });

  it('keeps the logo alt text and the monogram in step with the name', () => {
    const { rerender } = render(<LogoUpload name="Lakeside Dental" value={null} onChange={() => {}} />);
    expect(screen.getByText('LD')).toBeTruthy();
    rerender(<LogoUpload name="Harbour Pharmacy" value={null} onChange={() => {}} />);
    expect(screen.getByText('HP')).toBeTruthy();
    expect(screen.queryByText('LD')).toBeNull();
  });

  it('Upload opens the file picker and is keyboard operable', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click');
    const u = userEvent.setup();
    render(<LogoUpload name="Lakeside Dental" onChange={() => {}} />);
    await u.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Upload' }));
    await u.keyboard('{Enter}');
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});
