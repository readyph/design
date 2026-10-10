import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { PaperPlaneRight, WaveTriangle, X, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export type ChatSize = 'sm' | 'md' | 'lg';

const chatSizes: Record<ChatSize, string> = {
  sm: 'w-80 h-[26rem]',
  md: 'w-96 h-[34rem]',
  lg: 'w-[30rem] h-[40rem]',
};

export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  /** sm (compact) / md (panel) / lg (full). Width + height only; override with `className`. */
  size?: ChatSize;
}

/**
 * Presentational AI-chat shell (for Leda) in three sizes. Compose it from
 * `Chat.Header`, `Chat.Messages` + `Chat.Message`, `Chat.Input` and optional
 * `Chat.QuickActions`. The package renders the surface only — the project owns
 * the messages, streaming and what sending a message does.
 */
const ChatRoot = forwardRef<HTMLDivElement, ChatProps>(function Chat(
  { size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg',
        chatSizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface ChatHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Leading icon; defaults to a sparkle. */
  icon?: PhosphorIcon;
  /** Right-aligned controls. */
  actions?: ReactNode;
  /** Shows a close button that calls this. */
  onClose?: () => void;
}

const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(function ChatHeader(
  { title, subtitle, icon = WaveTriangle, actions, onClose, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 px-4 py-3', className)}
      {...rest}
    >
      {children ?? (
        <>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600">
            <Icon icon={icon} size="md" weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            {title && <p className="truncate text-sm font-semibold text-ink">{title}</p>}
            {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
          </div>
          {actions}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-base text-ink-subtle hover:bg-surface-muted hover:text-ink',
                focusRing,
              )}
            >
              <Icon icon={X} size="md" />
            </button>
          )}
        </>
      )}
    </div>
  );
});

/** Scrollable message list. Keep newest at the bottom; the app controls scroll. */
const ChatMessages = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ChatMessages(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface ChatMessageProps extends HTMLAttributes<HTMLDivElement> {
  role: 'user' | 'assistant';
  /** Show a typing indicator (e.g. while Leda streams). */
  streaming?: boolean;
}

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(function ChatMessage(
  { role, streaming = false, className, children, ...rest },
  ref,
) {
  const isUser = role === 'user';
  return (
    <div
      ref={ref}
      className={cn(
        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
        isUser
          ? 'self-end bg-primary-600 text-white rounded-br-sm'
          : 'self-start bg-surface-muted text-ink rounded-bl-sm',
        className,
      )}
      {...rest}
    >
      {children}
      {streaming && (
        <span className="ml-0.5 inline-flex gap-1 align-middle" aria-label="Leda is typing">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60" />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60"
            style={{ animationDelay: '300ms' }}
          />
        </span>
      )}
    </div>
  );
});

/** Optional row of quick-action chips above the input. */
const ChatQuickActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ChatQuickActions({ className, children, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap gap-2 px-3 py-2', className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

export interface ChatInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onSubmit'> {
  /** Called with the text when the user presses Enter or the send button. The project does the sending. */
  onSubmit?: (value: string) => void;
  /** Disable the send button (e.g. while a reply streams). */
  busy?: boolean;
  sendLabel?: string;
}

/**
 * Message composer. Enter submits, Shift+Enter inserts a newline. Controlled
 * (`value` + `onChange`) or uncontrolled; either way, `onSubmit` just hands you
 * the text — wiring it to the backend is the project's job.
 */
const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput(
  { onSubmit, busy = false, sendLabel = 'Send', value, className, onKeyDown, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const read = (): string => {
    if (value != null) return String(value);
    return innerRef.current?.value ?? '';
  };
  const submit = () => {
    const text = read();
    if (text.trim() && onSubmit) onSubmit(text);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="p-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div
        className={cn(
          'flex items-end gap-2 rounded-md border border-border bg-surface px-3 py-2',
          'focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-0',
          className,
        )}
      >
        <textarea
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }}
          rows={1}
          value={value}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          {...rest}
        />
        <button
          type="submit"
          disabled={busy}
          aria-label={sendLabel}
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-base bg-primary-600 text-white',
            'hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50',
            focusRing,
          )}
        >
          <Icon icon={PaperPlaneRight} size="sm" weight="fill" />
        </button>
      </div>
    </form>
  );
});

export const Chat = Object.assign(ChatRoot, {
  Header: ChatHeader,
  Messages: ChatMessages,
  Message: ChatMessage,
  QuickActions: ChatQuickActions,
  Input: ChatInput,
});

export {
  ChatHeader,
  ChatMessages,
  ChatMessage,
  ChatQuickActions,
  ChatInput,
};
