import type { Meta, StoryObj } from '@storybook/react';
import { StockerFramePage } from './Stocker.page';
import { StockerHomePage } from './Stocker.home';
import { StockerInPage } from './Stocker.in';
import { StockerOutPage } from './Stocker.out';
import { StockerFindPage } from './Stocker.find';
import { StockerAccountPage, StockerSignedOutPage } from './Stocker.account';

/**
 * [For Review] RDY-429, Stocker 1/6 (a). Prototype only: stories are not exported from the package. Stocker (handover 2.7): the shared frame, tabs, steps and states.
 * Source: inventory-home FINAL stocker.html, stocker.css, stocker.js 1-195. Data: Stocker.data.ts (dumped from data.js, receiving.js).
 * Later slices (b) to (f) append their stories to this file.
 */
const meta: Meta<typeof StockerFramePage> = { title: 'Prototypes/Inventory/Stocker', component: StockerFramePage, parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'mobile1' } } };
export default meta;
type Story = StoryObj<typeof StockerFramePage>;
const small = { viewport: { defaultViewport: 'mobile2' } };

export const Frame: Story = { name: '[For Review] Stocker frame (390)' };
export const FrameSmall: Story = { name: '[For Review] Stocker frame (360)', parameters: small };
export const Loading: Story = { name: '[For Review] Stocker loading (?state=loading)', args: { state: 'loading' } };
export const ErrorState: Story = { name: '[For Review] Stocker error (?state=error)', args: { state: 'error' } };
export const Empty: Story = { name: '[For Review] Stocker empty (?state=empty)', args: { state: 'empty' } };
export const Quiet: Story = { name: '[For Review] Stocker quiet (?state=quiet)', args: { state: 'quiet' } };
export const TenantB: Story = { name: '[For Review] Stocker frame (tenant B)', args: { tenant: 'b' } };

/* RDY-430, Stocker 2/6 (b): Home (stocker.js 196-217). */
const homeMeta = { component: StockerHomePage };
type HomeStory = StoryObj<typeof StockerHomePage>;
export const Home: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home', render: (a) => <StockerHomePage {...a} /> };
export const HomeSmall: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home (360)', parameters: small, render: (a) => <StockerHomePage {...a} /> };
export const HomeLoading: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home loading (?state=loading)', args: { state: 'loading' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeError: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home error (?state=error)', args: { state: 'error' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeEmpty: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home empty (?state=empty)', args: { state: 'empty' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeQuiet: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home quiet (?state=quiet)', args: { state: 'quiet' }, render: (a) => <StockerHomePage {...a} /> };
export const HomeTenantB: HomeStory = { ...homeMeta, name: '[For Review] Stocker Home (tenant B)', args: { tenant: 'b' }, render: (a) => <StockerHomePage {...a} /> };

const inMeta = { component: StockerInPage };
type InStory = StoryObj<typeof StockerInPage>;
const inStory = (name: string, args: Record<string, unknown> = {}, parameters?: typeof small): InStory => ({ ...inMeta, name: `[For Review] Stocker Stock in${name}`, args, parameters, render: (a) => <StockerInPage {...a} /> });
export const StockIn: InStory = inStory('');
export const StockInSmall: InStory = inStory(' (360)', {}, small);
export const StockInLoading: InStory = inStory(' loading (?state=loading)', { state: 'loading' });
export const StockInOrder: InStory = inStory(' which order (?via=order)', { via: 'order' });
export const StockInOrderError: InStory = inStory(' which order error (?via=order&state=error)', { via: 'order', state: 'error' });
export const StockInOrderQuiet: InStory = inStory(' which order quiet (?via=order&state=quiet)', { via: 'order', state: 'quiet' });
export const StockInOther: InStory = inStory(' something else (?via=other)', { via: 'other' });
export const StockInOtherProduct: InStory = inStory(' something else, product picked (?via=other&p=)', { via: 'other', p: 'p04' });
export const StockInReceive: InStory = inStory(' receive an order (?po=)', { po: 'PO-0222' });
export const StockInCheckIn: InStory = inStory(' check in a transfer (?tr=)', { tr: 'TR-0030' });
export const StockInDone: InStory = inStory(' done (?done=1)', { done: true });
export const StockInTenantB: InStory = inStory(' (tenant B)', { tenant: 'b' });

const outMeta = { component: StockerOutPage };
type OutStory = StoryObj<typeof StockerOutPage>;
const outStory = (name: string, args: Record<string, unknown> = {}, parameters?: typeof small): OutStory => ({ ...outMeta, name: `[For Review] Stocker Stock out${name}`, args, parameters, render: (a) => <StockerOutPage {...a} /> });
export const StockOut: OutStory = outStory('');
export const StockOutSmall: OutStory = outStory(' (360)', {}, small);
export const StockOutLoading: OutStory = outStory(' loading (?state=loading)', { state: 'loading' });
export const StockOutEmpty: OutStory = outStory(' empty (?state=empty)', { state: 'empty' });
export const StockOutQuiet: OutStory = outStory(' quiet (?state=quiet)', { state: 'quiet' });
export const StockOutProduct: OutStory = outStory(' product picked (?p=)', { p: 'p07' });
export const StockOutNone: OutStory = outStory(' nothing on hand (?p=)', { p: 'p10' });
export const StockOutSend: OutStory = outStory(' send a transfer (?tr=)', { tr: 'TR-0032' });
export const StockOutDone: OutStory = outStory(' done (?done=1)', { done: true });
export const StockOutTenantB: OutStory = outStory(' (tenant B)', { tenant: 'b' });
export const StockOutTenantBProduct: OutStory = outStory(' product picked (tenant B)', { tenant: 'b', p: 'b01' });

/* RDY-433, Stocker 5/6 (e): Find (stocker.js 218-314): stocker-find.html and its ?p, plus the ?np and ?ask views of stocker.html. */
const findMeta = { component: StockerFindPage };
type FindStory = StoryObj<typeof StockerFindPage>;
const findStory = (name: string, args: Record<string, unknown> = {}, parameters?: typeof small): FindStory => ({ ...findMeta, name: `[For Review] Stocker Find${name}`, args, parameters, render: (a) => <StockerFindPage {...a} /> });
export const Find: FindStory = findStory('');
export const FindSmall: FindStory = findStory(' (360)', {}, small);
export const FindLoading: FindStory = findStory(' loading (?state=loading)', { state: 'loading' });
export const FindEmpty: FindStory = findStory(' empty (?state=empty)', { state: 'empty' });
export const FindProduct: FindStory = findStory(' product (?p=)', { p: 'p07' });
export const FindProductComing: FindStory = findStory(' product with an order coming (?p=)', { p: 'p17' });
export const FindProductNone: FindStory = findStory(' nothing on hand (?p=)', { p: 'p10' });
export const FindNotFound: FindStory = findStory(' not found (?p=)', { p: 'zz' });
export const FindTenantB: FindStory = findStory(' (tenant B)', { tenant: 'b' });

const npaMeta = { component: StockerHomePage };
const npaStory = (name: string, args: Record<string, unknown>, parameters?: typeof small): HomeStory => ({ ...npaMeta, name: `[For Review] Stocker ${name}`, args, parameters, render: (a) => <StockerHomePage {...a} /> });
export const NewProduct: HomeStory = npaStory('New product (?np=)', { np: '4801230499990' });
export const NewProductSmall: HomeStory = npaStory('New product (?np=, 360)', { np: '4801230499990' }, small);
export const NewProductFromIn: HomeStory = npaStory('New product (?np=&from=in)', { np: '4801230499990', from: 'in' });
export const NewProductEmpty: HomeStory = npaStory('New product, no barcode (?np=)', { np: '' });
export const Ask: HomeStory = npaStory('Tell your manager (?ask=new)', { ask: 'new' });
export const AskCount: HomeStory = npaStory('Tell your manager, count (?ask=count&p=)', { ask: 'count', p: 'p04' });
export const AskSmall: HomeStory = npaStory('Tell your manager (?ask=new, 360)', { ask: 'new' }, small);

/* RDY-434, Stocker 6/6 (f): Account (stocker-me.html, stocker.js 617-623) and Signed out (stocker-signedout.html, stocker.js 625-634). */
const meMeta = { component: StockerAccountPage };
type MeStory = StoryObj<typeof StockerAccountPage>;
const meStory = (name: string, args: Record<string, unknown> = {}, parameters?: typeof small): MeStory => ({ ...meMeta, name: `[For Review] Stocker Account${name}`, args, parameters, render: (a) => <StockerAccountPage {...a} /> });
export const Account: MeStory = meStory('');
export const AccountSmall: MeStory = meStory(' (360)', {}, small);
export const AccountLoading: MeStory = meStory(' loading (?state=loading)', { state: 'loading' });
export const AccountError: MeStory = meStory(' error (?state=error)', { state: 'error' });
export const AccountTenantB: MeStory = meStory(' (tenant B)', { tenant: 'b' });

const outedMeta = { component: StockerSignedOutPage };
type SignedStory = StoryObj<typeof StockerSignedOutPage>;
const signedStory = (name: string, args: Record<string, unknown> = {}, parameters?: typeof small): SignedStory => ({ ...outedMeta, name: `[For Review] Stocker Signed out${name}`, args, parameters, render: (a) => <StockerSignedOutPage {...a} /> });
export const SignedOut: SignedStory = signedStory('');
export const SignedOutSmall: SignedStory = signedStory(' (360)', {}, small);
export const SignedOutTenantB: SignedStory = signedStory(' (tenant B)', { tenant: 'b' });
