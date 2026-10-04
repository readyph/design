/* ReadyPH UI — React components on Tailwind + Radix + Phosphor. */

// Design tokens (values + types)
export * from './tokens';

// Utilities
export { cn, focusRing } from './utils/cn';
export { formatShortcut } from './utils/shortcut';

// Providers & hooks
export {
  ShortcutModeProvider,
  useShortcutMode,
  type ShortcutModeProviderProps,
} from './providers/ShortcutModeProvider';
export { useHotkeys, type HotkeyMap, type UseHotkeysOptions } from './hooks/useHotkeys';

// Primitives
export { Icon, type IconComponentProps } from './components/Icon';
export { Kbd, type KbdProps } from './components/Kbd';
export { Spinner, type SpinnerProps } from './components/Spinner';

// Actions
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './components/Button';
export { IconButton, type IconButtonProps } from './components/IconButton';
export { Link, type LinkProps } from './components/Link';

// Forms
export { Field, useField, type FieldProps } from './components/Field';
export { Input, inputBase, inputState, type InputProps, type InputSize } from './components/Input';
export { Textarea, type TextareaProps } from './components/Textarea';
export { Select, type SelectProps, type SelectOption } from './components/Select';
export { Checkbox, type CheckboxProps } from './components/Checkbox';
export { Switch, type SwitchProps } from './components/Switch';
export { RadioGroup, type RadioGroupProps, type RadioOption } from './components/RadioGroup';
export { Form, FormActions, type FormProps, type FormActionsProps } from './components/Form';
export { SearchBar, type SearchBarProps } from './components/SearchBar';

// Feedback
export { Badge, type BadgeProps, type BadgeTone } from './components/Badge';
export { Tag, type TagProps } from './components/Tag';
export { RoleBadge, type RoleBadgeProps } from './components/RoleBadge';
export { Notice, type NoticeProps, type NoticeTone } from './components/Notice';
export { StatusDot, type StatusDotProps, type StatusTone } from './components/StatusDot';
export { ProgressBar, type ProgressBarProps } from './components/ProgressBar';
export { Skeleton, type SkeletonProps } from './components/Skeleton';
export { EmptyState, type EmptyStateProps } from './components/EmptyState';
export { Toaster, type ToasterProps } from './components/toast/Toaster';
export {
  toast,
  useToast,
  useToasts,
  addToast,
  dismissToast,
  clearToasts,
  type ToastMessage,
  type ToastTone,
  type ToastOptions,
} from './components/toast/toastStore';

// Data display
export { Card, CardHeader, CardFooter, type CardProps } from './components/Card';
export { Avatar, type AvatarProps, type AvatarSize } from './components/Avatar';
export { AvatarGroup, type AvatarGroupProps } from './components/AvatarGroup';
export { Table, type TableProps, type TableColumn } from './components/Table';
export { Stat, type StatProps } from './components/Stat';
export { Sparkline, type SparklineProps, type SparklineTone } from './components/Sparkline';
export { DataList, type DataListProps, type DataListItem } from './components/DataList';
export { Accordion, type AccordionProps, type AccordionItemDef } from './components/Accordion';

// Chat (Leda)
export {
  Chat,
  ChatHeader,
  ChatMessages,
  ChatMessage,
  ChatQuickActions,
  ChatInput,
  type ChatProps,
  type ChatSize,
  type ChatHeaderProps,
  type ChatMessageProps,
  type ChatInputProps,
} from './components/Chat';

// Navigation
export { Tabs, TabPanel, type TabsProps, type TabItem, type TabPanelProps } from './components/Tabs';
export { SegmentedControl, type SegmentedControlProps, type SegmentOption } from './components/SegmentedControl';
export { Pagination, type PaginationProps } from './components/Pagination';
export { Breadcrumbs, type BreadcrumbsProps, type Crumb } from './components/Breadcrumbs';
export {
  Sidebar,
  SidebarSection,
  SidebarItem,
  type SidebarProps,
  type SidebarSectionProps,
  type SidebarItemProps,
} from './components/Sidebar';
export { IconRail, IconRailItem, type IconRailProps, type IconRailItemProps } from './components/IconRail';
export { TopBar, type TopBarProps } from './components/TopBar';
export { MainNav, MainNavItem, type MainNavProps, type MainNavItemProps } from './components/MainNav';

// Overlays
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  type ModalProps,
  type ModalSize,
} from './components/Modal';
export { ConfirmDialog, type ConfirmDialogProps } from './components/ConfirmDialog';
export {
  Drawer,
  OffCanvas,
  OffCanvasHeader,
  OffCanvasBody,
  OffCanvasFooter,
  type DrawerProps,
  type OffCanvasProps,
} from './components/Drawer';
export { Tooltip, TooltipProvider, type TooltipProps } from './components/Tooltip';
export { Popover, type PopoverProps } from './components/Popover';
export { Menu, type MenuProps, type MenuItem } from './components/Menu';

// Layout pieces
export { Divider, type DividerProps } from './components/Divider';
export { PageHeader, type PageHeaderProps } from './components/PageHeader';
export { SettingsSection, type SettingsSectionProps } from './components/SettingsSection';
