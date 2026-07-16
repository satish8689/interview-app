'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from '../personal/personal.module.scss'; // reuse the same scss module (same classnames as PersonalQA)

/* -------------------- TAB 1: SIMPLE -------------------- */
const SIMPLE_QUESTIONS =[
  {
    id: 1,
    question: 'What is React and why is it different from other frameworks like Angular?',
    answer: `React is a declarative, component-based JavaScript library (not a full MVC framework) for building UIs. You describe "what UI should look like for a given state" and React handles the DOM updates itself — you never manually query/manipulate DOM nodes.

Key differences from Angular:
• React is a library (UI layer only), you pick routing/state management yourself — Angular is a full framework with everything built-in (DI, routing, forms, HTTP client).
• React uses JSX + Virtual DOM diffing; Angular uses real DOM with two-way data binding and zone.js for change detection.
• React's unidirectional data flow (data down, events up) makes state changes easier to trace than Angular's two-way binding.

In practice, I picked React + Next.js for client dashboards because I only needed the UI layer and wanted flexibility to choose my own state/data-fetching approach per project — school app needed simple Context, Bright Owl needed more real-time state for the game modules.`,
  },
  {
    id: 2,
    question: 'Explain the Virtual DOM, diffing, and reconciliation in depth.',
    answer: `Virtual DOM is a plain JS object tree that mirrors the real DOM structure. On every state/prop change, React builds a new Virtual DOM tree and compares it to the previous one — this comparison process is "diffing".

React's diffing algorithm is O(n) instead of the theoretical O(n³) tree-diff, because it uses heuristics:
• Different element type at same position → destroy old subtree completely, mount new one fresh (loses state).
• Same element type → keep the DOM node, just patch changed attributes/children.
• Lists → uses the "key" prop to match items across renders instead of comparing by position, so reordering doesn't wrongly reset item state.

Reconciliation is the overall process of applying the diff results to the real DOM in a batched, minimal way — this is what makes React fast despite doing "extra work" of building a virtual tree first.

I explain it this way in interviews: real DOM writes are expensive, so React does cheap JS-object comparisons first and touches the real DOM only for what actually changed.`,
  },
  {
    id: 3,
    question: 'What is React Fiber and why was it introduced?',
    answer: `Fiber is React's internal reconciliation engine (rewritten in React 16), replacing the old "stack reconciler". Old reconciler worked synchronously — once it started rendering a big tree, it couldn't pause, causing dropped frames/janky UI on heavy updates.

Fiber introduced:
• Incremental rendering — work is split into units (fibers) that can be paused, resumed, or aborted.
• Priority-based scheduling — urgent updates (typing, clicks) can interrupt low-priority ones (offscreen rendering, data fetching).
• This is the foundation for features like Concurrent Rendering, Suspense, useTransition, and time-slicing.

I don't touch Fiber directly in day-to-day code, but understanding it explains *why* useTransition/startTransition exist — they're literally telling Fiber "this update is low priority, don't block the urgent stuff."`,
  },
  {
    id: 4,
    question: 'What is the difference between State and Props? Explain with data flow.',
    answer: `Props — read-only data passed from parent to child. Child cannot mutate them; if child needs to "change" a prop, parent must pass a callback down.

State — data owned and managed inside a component, mutable via setState/useState, and its change triggers a re-render of that component (and its subtree).

Data flow is unidirectional: state lives in the component that owns it (or lifted up to a common ancestor), flows down as props, and events flow back up via callbacks. This one-way flow is what makes debugging predictable — you always know data changes from top to bottom.

Real example: in Bright Owl's game component, 'score' and 'level' are state (owned locally, changes based on gameplay), but 'studentId' is a prop passed down from the dashboard — the game component never changes who the student is, it just consumes that value.`,
  },
  {
    id: 5,
    question: 'What are Controlled vs Uncontrolled components? When would you choose one over the other?',
    answer: `Controlled component — form input's value is fully driven by React state; every keystroke fires onChange, updates state, and React re-renders the input with the new value. React is the "single source of truth".

<input value={name} onChange={(e) => setName(e.target.value)} />

Uncontrolled component — input manages its own value internally in the DOM; React reads it via a ref only when needed (e.g. on submit), not on every keystroke.

<input ref={inputRef} defaultValue="John" />
// later: inputRef.current.value

When to choose:
• Controlled — when you need validation on every keystroke, conditional enabling/disabling of submit, or need to sync value elsewhere in the UI live. I use this for Zod-validated forms in the school management app.
• Uncontrolled — simple forms, file inputs (always uncontrolled since browsers don't allow controlling file input value), or performance-sensitive forms with many fields where re-rendering on every keystroke is wasteful (then I'd combine uncontrolled + React Hook Form which uses refs internally).`,
  },
  {
    id: 6,
    question: 'What are React Hooks? What rules must you follow and why?',
    answer: `Hooks let functional components use state, lifecycle-like behavior, and context without writing class components — they were introduced in React 16.8 to solve issues like reusable stateful logic being hard to share between class components (wrapper hell with HOCs).

Two strict rules:
• Only call hooks at the top level — never inside loops, conditions, or nested functions.
• Only call hooks from React function components or custom hooks — not regular JS functions.

Why these rules exist: React tracks hooks by call order, not by name — internally it's a linked list per component instance. If a hook is called conditionally, the order shifts between renders and React ends up mapping the wrong state to the wrong hook slot, causing subtle bugs.

I got a real taste of "why order matters" when I once moved a useState call inside an if-condition while refactoring — component started showing stale/mismatched state, and ESLint's react-hooks/rules-of-hooks plugin caught it immediately.`,
  },
  {
    id: 7,
    question: 'Explain useEffect deeply — cleanup, dependency array, and common pitfalls.',
    answer: `useEffect runs side-effect code after the DOM has been painted — API calls, subscriptions, timers, manual DOM work, logging.

useEffect(() => {
  const sub = subscribeToSomething(id);
  return () => sub.unsubscribe(); // cleanup
}, [id]);

Dependency array behavior:
• [] → runs once after first mount, cleanup runs on unmount only.
• [id] → runs after mount AND whenever id changes; cleanup from previous run fires before the next run.
• no array → runs after every single render (rarely what you want).

Common pitfalls:
• Stale closures — effect captures old state/props if dependency array is missing a value, since the function was created with old variables in scope.
• Missing cleanup — subscriptions/timers not cleared, causing memory leaks or effects running on unmounted components.
• Object/array dependencies — passing a new object/array literal each render makes the effect re-run every time even though "logically" nothing changed; fix with useMemo or moving the value outside.

I hit the stale closure bug in the video reels component — dependency array was missing the current video index, so the effect kept referencing the first video even after scrolling to new ones. Fixed by adding the missing dependency and enabling the exhaustive-deps ESLint rule so it doesn't happen again.`,
  },
  {
    id: 8,
    question: 'What is prop drilling and how do you solve it? Compare Context API vs Redux/Zustand.',
    answer: `Prop drilling is passing data through multiple intermediate components that don't need it themselves, just to reach a deeply nested child — makes components tightly coupled and refactoring painful.

Solutions and trade-offs:
• Context API — built into React, good for low-frequency-changing global data (theme, auth user, locale). Downside: any value change re-renders ALL consumers, even if a consumer only cares about part of the value — can hurt performance if used for frequently-changing state.
• Redux/Zustand — external state libraries with better performance for frequently-updated state, devtools for time-travel debugging, middleware support (thunks/sagas). More boilerplate (Redux) or minimal boilerplate (Zustand).
• Component composition — pass components as children/props instead of drilling data, so intermediate components don't need to know about the data at all.

My rule of thumb: Context API for rarely-changing global values (auth user, theme — used this in admin panels), Zustand/Redux when state changes often and multiple unrelated components need to read/write it efficiently (would reach for Zustand first now, less boilerplate than Redux for mid-size apps).`,
  },
  {
    id: 9,
    question: 'useMemo vs useCallback vs React.memo — explain the difference and when each is actually needed.',
    answer: `All three exist to avoid unnecessary recalculation or re-rendering, but operate at different levels:

• useMemo — memoizes a computed VALUE, recalculates only when dependencies change.
const total = useMemo(() => calculateTotal(items), [items]);

• useCallback — memoizes a FUNCTION reference itself, so the same function identity is reused across renders (important when passing callbacks to memoized children, since a new function reference every render would break React.memo's shallow comparison).
const handleClick = useCallback(() => doSomething(id), [id]);

• React.memo — wraps a COMPONENT, skips re-render if props are shallow-equal to previous render.

Important nuance: these aren't free — memoization itself has a cost (storing previous value, comparing dependencies). Overusing them on cheap components/values can make code slower and harder to read, not faster. I only reach for these after actually profiling with React DevTools and seeing a real re-render problem — like in the video reels component, where React.memo + useCallback together stopped every video card from re-rendering when only one card's play state changed.`,
  },
  {
    id: 10,
    question: 'What are Keys in React lists? Why is index-as-key dangerous?',
    answer: `Key is a special prop that helps React's diffing algorithm identify which list items are the same across renders — so it can match, reorder, or remove DOM nodes correctly instead of re-rendering the entire list.

{students.map((s) => <StudentCard key={s.id} data={s} />)}

Why index-as-key is dangerous: if list order can change (sort, filter, insert, delete from middle), the index no longer maps to the same logical item. React ends up matching the wrong DOM node to the wrong data — this causes bugs where component-local state (like an "editing" input's value) sticks to the wrong row after a delete/reorder, or causes unnecessary full remounts losing focus/animation state.

I had exactly this bug in a customer list with inline edit — deleting a customer in the middle caused the LAST row to visually "change" instead of disappearing, because index-based keys shifted every subsequent row's identity by one. Switched to 'key={customer.id}' and it was fixed immediately — good story to tell in interviews because it shows I understand keys aren't just "to remove a console warning".`,
  },
  {
    id: 11,
    question: 'What is the Context API and what are its performance limitations?',
    answer: `Context API lets you share data across a component tree without manually passing props through every level.

const ThemeContext = createContext();
<ThemeContext.Provider value={theme}>...</ThemeContext.Provider>
const theme = useContext(ThemeContext);

Performance limitation: whenever the Provider's 'value' changes, EVERY component consuming that context re-renders — regardless of whether it uses the specific part of the value that changed. This is worse if you pass a new object literal as value on every render ('value={{ user, theme }}'), since that's a new reference every time even if the actual data didn't change.

Fixes:
• Memoize the context value with useMemo.
• Split contexts by concern (AuthContext, ThemeContext separately) instead of one giant context, so unrelated updates don't cause unrelated re-renders.
• For frequently changing state, prefer a proper state library (Zustand/Redux) which supports selector-based subscriptions (component only re-renders if the specific slice it selected changes).

I used Context for theme/design tokens in Bright Owl (rarely changes, so performance isn't a concern there), but would avoid Context for something like real-time game score that updates every second across many components.`,
  },
  {
    id: 12,
    question: 'What are Higher-Order Components (HOC), Render Props, and Custom Hooks? Which is preferred today and why?',
    answer: `All three solve the same problem — sharing reusable logic across components — but with different mechanics:

• HOC — a function that takes a component and returns a new enhanced component.
const withAuth = (Component) => (props) => {
  if (!isLoggedIn()) return <Redirect />;
  return <Component {...props} />;
};
Downside: "wrapper hell" (deeply nested component tree in DevTools), prop name collisions between HOCs.

• Render Props — a component takes a function as a prop/child and calls it with data.
<DataProvider render={(data) => <Child data={data} />} />
Downside: nested callback syntax gets messy with multiple render props.

• Custom Hooks — a function starting with "use" that extracts reusable stateful logic, composed directly inside function components.
function useAuth() { const [user, setUser] = useState(null); ...; return user; }

Custom hooks are the modern preferred approach — no wrapper components, no nesting, easy to compose multiple hooks together, and logic reads top-to-bottom like normal code. I built a 'useSpeechRecognition' custom hook to reuse Web Speech API logic across multiple Bright Owl components — would've been much messier as an HOC or render prop.`,
  },
  {
    id: 13,
    question: 'What is code splitting and lazy loading? How does Suspense fit in?',
    answer: `Code splitting breaks a single large JS bundle into smaller chunks that load only when needed, instead of shipping the entire app upfront — directly improves initial load/Time-to-Interactive.

React.lazy() + Suspense is the standard pattern for component-level splitting:
const Dashboard = React.lazy(() => import('./Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>

Suspense lets a component "wait" for something (lazy-loaded code, or in newer React, async data via the use() API) and shows a fallback UI meanwhile, without manual loading-state booleans scattered everywhere.

In Next.js, route-based code splitting is automatic per page. I additionally lazy-load heavy, non-critical-path client components manually — PDF report generator and Recharts-based analytics charts — so they don't bloat the initial dashboard bundle for users who might not even open those sections.`,
  },
  {
    id: 14,
    question: 'What causes unnecessary re-renders in React, and how do you actually diagnose and fix them?',
    answer: `Common causes:
• Parent re-renders → all children re-render by default even if their own props are unchanged (React doesn't skip children automatically).
• Inline object/array/function literals in JSX — creates a new reference every render, breaking memoization of children.
• Context value changing every render (new object each time as Provider value).
• Missing/incorrect keys in lists causing full remounts instead of updates.

How I diagnose it: React DevTools Profiler — record an interaction, see the flamegraph of which components rendered and why (it shows "why did this render" hints). This is far more reliable than guessing.

Fixes, in order of preference:
• Move state down closer to where it's actually used (avoid lifting state higher than necessary).
• React.memo on pure/expensive child components.
• useMemo/useCallback to stabilize references passed to memoized children.
• Split one large component into smaller ones so an update only re-renders the affected slice.

I used the Profiler to catch a real issue in the video reels component — a parent scroll-position state update was re-rendering every visible video card on every scroll tick. Fixed with React.memo on the card + moving scroll tracking into a ref instead of state where a re-render wasn't actually needed.`,
  },
  {
    id: 15,
    question: 'What is React.memo, how does it compare props, and what are its limitations?',
    answer: `React.memo wraps a component and skips re-rendering if the new props are shallow-equal to the previous props (compares each prop with Object.is, one level deep — not deep equality).

const VideoCard = React.memo(function VideoCard({ video }) {
  return <div>{video.title}</div>;
});

Limitations:
• Shallow comparison means a new object/array/function reference (even with identical contents) is treated as "changed" — so you must pair it with useMemo/useCallback upstream for it to actually help.
• Doesn't help if the component re-renders due to its OWN internal state changing (memo only prevents re-renders caused by parent re-renders with same props).
• You can pass a custom comparison function as the second argument for more control, but that adds complexity and a maintenance burden.

I applied React.memo on individual video card components in the reels feature — without it, every parent state tick (like updating "currently playing" index) was re-rendering all 10+ visible video cards; with memo + stable props, only the actually-affected card re-renders.`,
  },
  {
    id: 16,
    question: 'What is the difference between useLayoutEffect and useEffect?',
    answer: `Both run side effects after render, but at different timing relative to the browser paint:

• useEffect — runs asynchronously AFTER the browser has painted the screen. Doesn't block visual updates.
• useLayoutEffect — runs synchronously BEFORE the browser paints, right after DOM mutations. Blocks painting until it finishes.

When to use useLayoutEffect: when you need to read layout (DOM measurements like element size/position) and synchronously make a visual adjustment BEFORE the user sees any flicker — e.g. measuring a tooltip's size to reposition it before paint, so there's no visible "jump".

For everything else (API calls, subscriptions, logging), useEffect is correct and better for performance since it doesn't block painting. Using useLayoutEffect unnecessarily can make the UI feel janky since it delays paint. I only reached for useLayoutEffect once — measuring an accordion's content height before animating it open, to avoid a visible jump on first render.`,
  },
  {
    id: 17,
    question: 'Explain React Server Components (RSC) and how they differ from SSR.',
    answer: `Server-Side Rendering (SSR) — the entire component (including client interactivity) is rendered to HTML on the server for the FIRST load, then the same component's JS is shipped to the browser and "hydrated" to become interactive. The component code still ends up in the client bundle.

React Server Components — components that run ONLY on the server, EVERY time (not just first load), and NEVER ship their JS to the browser at all. They can directly access backend resources (DB, filesystem) without an API layer, and their rendered output streams to the client as a special format, not as HTML+JS to hydrate.

Key rules:
• Server Components can import and render Client Components, but not vice versa directly.
• Server Components can't use useState/useEffect/event handlers — no interactivity, no browser APIs.
• Mark interactive parts explicitly with 'use client'.

Practically in Next.js App Router, I keep data-heavy dashboard pages (fetching lists, tables) as Server Components — cuts client JS bundle size significantly — and mark only the interactive pieces (forms, modals, filters) as Client Components, keeping the client boundary as small as possible.`,
  },
  {
    id: 18,
    question: 'What is Reconciliation and how does React decide to reuse vs recreate a DOM node?',
    answer: `Reconciliation is the algorithm React uses to update the real DOM to match the new Virtual DOM tree, doing the minimum work possible.

Decision rules React follows when comparing old vs new tree at each node:
• Different component/element type at the same position → React unmounts the old subtree completely and mounts a fresh one — all local state in that subtree is lost.
• Same type → React keeps the same underlying DOM node/component instance, and just updates changed attributes/props — local state is preserved.
• Lists → uses 'key' to match old and new items; matched items are updated in place (state preserved), unmatched ones are mounted/unmounted.

This is why, for example, conditionally rendering '<Modal />' vs '<div />' in the same spot resets all state inside — different types. But conditionally rendering '<Modal isOpen={true/false} />' (same type, different prop) preserves the Modal's internal state across toggles. Understanding this distinction has saved me from "why did my form data disappear" bugs multiple times.`,
  },
  {
    id: 19,
    question: 'What is an Error Boundary and how do you implement one? Why can\'t it be a function component?',
    answer: `Error Boundary is a component that catches JavaScript errors thrown anywhere in its child component tree during rendering, in lifecycle methods, and in constructors — and shows a fallback UI instead of crashing the whole app.

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { logErrorToService(error, info); }
  render() {
    if (this.state.hasError) return <FallbackUI />;
    return this.props.children;
  }
}

Why it must be a class component: 'getDerivedStateFromError' and 'componentDidCatch' are lifecycle methods that don't have functional-hook equivalents yet — there's no 'useErrorBoundary' hook in stable React as of now. So error boundaries remain one of the few places class components are still necessary (or you use a library like 'react-error-boundary' which wraps this pattern for you).

Important limitation: error boundaries don't catch errors in event handlers, async code (setTimeout, fetch callbacks), or errors in the boundary itself — for those, plain try/catch is still needed. I wrap major dashboard sections (like the chart/report panel) in error boundaries so one broken widget doesn't crash the entire admin panel.`,
  },
  {
    id: 20,
    question: 'What is useTransition and useDeferredValue? Why were they introduced?',
    answer: `Both are Concurrent React features that let you mark certain UI updates as "low priority" so urgent updates (typing, clicking) don't get blocked by expensive re-renders.

useTransition — wraps a state update as non-urgent:
const [isPending, startTransition] = useTransition();
startTransition(() => setSearchResults(filterHugeList(query)));
The input stays instantly responsive while the (potentially slow) results list update happens in the background; 'isPending' lets you show a subtle loading indicator.

useDeferredValue — defers using a value until urgent renders are done:
const deferredQuery = useDeferredValue(query);
// use deferredQuery for the expensive computation, query for the input display

Why introduced: before these, any expensive synchronous re-render (like filtering a large list on every keystroke) would make the input itself feel laggy, because React rendering is normally synchronous and blocking. These hooks let React interrupt low-priority work to keep high-priority (user input) updates smooth — this is only possible because of the Fiber architecture underneath.

I'd reach for these in something like a large searchable student/customer table where filtering thousands of rows on every keystroke was making typing feel laggy.`,
  },
  {
    id: 21,
    question: 'How does React handle events internally — what is the Synthetic Event system?',
    answer: `React doesn't attach event listeners directly to each individual DOM element. Instead, it uses event delegation — attaching a single listener at the root of the app (previously at 'document', now at the root container since React 17) and using event bubbling to figure out which component's handler to call.

React wraps native browser events in a SyntheticEvent object — a cross-browser wrapper that normalizes event properties (like 'event.target', 'preventDefault()') so behavior is consistent across browsers, since raw native events used to differ slightly between them historically.

Why this matters practically:
• Better performance — one listener per event type instead of thousands of individual DOM listeners for a big list.
• 'event.stopPropagation()' on a SyntheticEvent doesn't stop native event propagation the same way — occasionally causes confusion if mixing native listeners with React's system.
• Since React 17, events are delegated to the root DOM container of the React tree (not 'document'), making it safer to embed multiple React versions on one page.

Knowing this helped me debug a weird case where a native 'addEventListener(\\'click\\', ...)' I added manually on 'document' was firing in an unexpected order relative to React's synthetic handlers — event delegation is why.`,
  },
  {
    id: 22,
    question: 'What is the difference between useState and useReducer? When would you pick useReducer?',
    answer: `useState — simple state updates, good for independent, primitive, or simple-shaped values.
const [count, setCount] = useState(0);

useReducer — manages more complex state via a reducer function (action-based updates), similar pattern to Redux but local to a component.
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'increment' });

When to prefer useReducer:
• State has multiple sub-values that update together (e.g. a form with loading/error/data all changing based on the same action).
• Next state depends on the previous state in a non-trivial way.
• You want to centralize "what actions are possible" in one place (the reducer function) rather than scattered setState calls — makes complex state transitions easier to trace and test.
• When passing down update logic to deeply nested children, 'dispatch' is a stable reference (doesn't need useCallback), unlike passing multiple individual setter functions.

I used useReducer for a multi-step form wizard in the school app admission flow — tracking current step, form data across steps, and validation errors together as one cohesive state made much more sense than five separate useState calls that could get out of sync.`,
  },
  {
    id: 23,
    question: 'What are Portals in React and when do you need them?',
    answer: `A Portal lets you render a child component into a DOM node that exists OUTSIDE the parent component's DOM hierarchy, while it still behaves like a normal React child for context, event bubbling, and lifecycle purposes.

ReactDOM.createPortal(
  <Modal />,
  document.getElementById('modal-root')
);

Why needed: CSS properties like 'overflow: hidden', 'z-index' stacking contexts, or 'position: relative' on ancestor elements can visually clip or misposition components like modals, tooltips, or dropdowns if they're rendered deep inside a normal component tree. Portals let you render them at the top level of the DOM (outside the clipping container) while keeping them logically part of the React component tree — so props, context, and event handling still work as expected, and a click "inside" the portal still bubbles up through React's tree to parent handlers.

I used a portal for a confirmation modal in the optical shop admin panel — the modal was getting visually clipped by a parent table's 'overflow: auto', rendering it at 'document.body' via a portal fixed it instantly without restructuring the whole layout.`,
  },
  {
    id: 24,
    question: 'What is Strict Mode in React and what does it actually do?',
    answer: `<React.StrictMode> is a development-only tool that helps surface potential problems early — it adds no visible UI and has zero effect in production builds.

What it does in development:
• Double-invokes component function bodies, and some lifecycle/effect functions, on purpose — to help you catch side effects that aren't properly cleaned up (an effect with a missing cleanup will visibly misbehave under double-invocation, revealing the bug before production).
• Warns about usage of deprecated/unsafe lifecycle methods.
• Helps detect unexpected side effects in render (render should be a pure function of props/state — no mutations, no API calls directly in render body).

This double-render behavior confused me the first time — I thought a 'console.log' in my component was a bug because it fired twice, until I realized that's StrictMode intentionally checking my code is resilient to being re-invoked. It's a good habit-forming tool — if double-invocation breaks something, that something was already fragile and would likely break for real reasons later (like Concurrent rendering pausing and restarting work).`,
  },
  {
    id: 25,
    question: 'How do you optimize the performance of a large React application in a real project? Give a checklist.',
    answer: `Practical checklist I actually follow, roughly in priority order:

• Profile first — use React DevTools Profiler to find the ACTUAL slow component before optimizing blindly.
• Code splitting — React.lazy/next/dynamic for heavy, non-critical components (charts, PDF generators, rich text editors).
• Virtualization — react-window/TanStack Virtual for long lists/tables instead of rendering thousands of DOM nodes.
• Memoization — React.memo/useMemo/useCallback, but only where profiling shows a real win, not everywhere by default (over-memoizing adds its own overhead).
• Move state down — keep state as close as possible to where it's used, so unrelated components don't re-render.
• Avoid inline object/array/function literals passed as props to memoized children.
• Images — next/image for automatic lazy loading/optimization instead of raw '<img>'.
• Server Components (in Next.js) for data-heavy, non-interactive sections to reduce client JS shipped entirely.
• Bundle analysis — @next/bundle-analyzer to catch accidentally-large dependencies pulled into the client bundle.
• Debounce/throttle expensive operations tied to frequent events (search-as-you-type, scroll, resize).

I applied several React performance optimization techniques in the Reading Cinemas online booking platform, especially in the seat selection and booking flow where users interact with a large number of seats in real time. I used React.memo to prevent unnecessary re-renders of individual seat components, so selecting one seat didn't cause the entire seating layout to re-render. I also optimized expensive calculations using useMemo and memoized event handlers with useCallback to avoid unnecessary child component updates. On the backend, AWS Lambda handled booking requests with automatic scaling during peak traffic, while PostgreSQL stored booking and seat availability data. These optimizations made the seat selection experience much smoother and improved performance during high user traffic.
The seating layout contained hundreds of seat components. Without optimization, clicking on a single seat caused all seat components to re-render. By wrapping each seat component with React.memo and keeping the props stable using useCallback, only the selected seat and the seats whose state actually changed were re-rendered. This significantly reduced rendering time and improved the user experience.
`,
  },
  {
    id: 26,
    question: 'What is the difference between React 18\'s automatic batching and previous React versions?',
    answer: `Batching means React groups multiple state updates into a single re-render instead of re-rendering once per update — better performance, fewer wasted renders.

Before React 18: batching only happened automatically inside React event handlers (onClick, onChange). Updates inside promises, setTimeout, native event handlers, or async/await code were NOT batched — each setState call triggered a separate re-render.

setTimeout(() => {
  setCount(c => c + 1); // separate render (pre-18)
  setFlag(f => !f);      // separate render (pre-18)
}, 0);

React 18 introduced automatic batching everywhere — the above example now batches into a single re-render regardless of where the updates happen (timeouts, promises, native handlers), via 'createRoot' API.

If you truly need a synchronous, un-batched update in a specific spot, 'flushSync' from react-dom can force it, but that's rare and usually a sign of working around a design issue rather than something needed regularly. Knowing this matters when debugging "why did this only re-render once" vs "twice" behavior differences between React 17 and 18 codebases.`,
  },
  {
    id: 27,
    question: 'What is Composition vs Inheritance in React, and why does React favor composition?',
    answer: `React has no built-in inheritance-based component-sharing mechanism (unlike some OOP UI frameworks) — it strongly favors composition for reusing code between components.

Composition patterns:
• children prop — pass arbitrary JSX into a wrapper component.
function Card({ children }) { return <div className="card">{children}</div>; }
<Card><UserProfile /></Card>

• Specialization — a specific component built by configuring a more generic one with props.
function WelcomeDialog() { return <Dialog title="Welcome" message="Thanks for joining"/>; }

Why composition over inheritance: inheritance ties components together rigidly at "design time" through a class hierarchy, making it hard to reuse partial behavior or change structure later. Composition assembles components at "runtime" through props/children — much more flexible, avoids fragile deep hierarchies, and matches how React's rendering model (data flows down as props) already works naturally.

Practically I never reach for class-based inheritance between components — anytime I want to share layout structure (card wrappers, modal shells, page layouts), I build a wrapper component that accepts 'children', which composes cleanly with whatever content each page/feature needs.`,
  },
  {
    id: 28,
    question: 'What is hydration in React and what problems can go wrong with it (hydration mismatch)?',
    answer: `Hydration is the process where React "attaches" event listeners and internal state to server-rendered HTML in the browser, making already-visible HTML interactive — instead of re-rendering the DOM from scratch, React reuses the existing markup and just wires up the JS behavior on top of it.

Hydration mismatch happens when the HTML React renders on the CLIENT during hydration doesn't match what the SERVER originally sent — React detects the difference and either warns or, in some cases, discards and re-renders the mismatched part, causing a visible flicker.

Common causes:
• Using browser-only APIs ('window', 'localStorage', 'Date.now()', 'Math.random()') directly in render logic that runs on both server and client, producing different output each side.
• Conditionally rendering based on something only known client-side (like 'typeof window !== \\'undefined\\'') without guarding it properly.
• Browser extensions injecting DOM before React hydrates, or invalid nested HTML causing the browser to auto-correct markup differently than React expects.

Fix: move client-only logic into a 'useEffect' (which only runs after hydration, client-side) and use state to render the client-specific UI in a second pass, or use Next.js-specific solutions like 'suppressHydrationWarning' for known, harmless mismatches (like a timestamp). I hit this once with a "time ago" label using 'new Date()' directly in render — moved the calculation into a 'useEffect' + state to fix the mismatch warning.`,
  },
  {
    id: 29,
    question: 'How would you test React components? What\'s the difference between unit, integration, and E2E testing here?',
    answer: `Three levels, each with a different goal and tool:

• Unit tests — test a single component or function in isolation, mocking dependencies. Tools: Jest/Vitest + React Testing Library. Focus on "does this component render correctly given these props/state, and does clicking a button call the right handler" — NOT implementation details like internal state variable names.

• Integration tests — test multiple components working together (a form + its validation + submit flow), closer to how a user actually interacts with a feature, still within a simulated DOM (jsdom), no real browser.

• End-to-End (E2E) tests — test the full app in a real browser against a real (or staging) backend, simulating actual user journeys. Tools: Playwright, Cypress. Slower and more brittle than unit tests, but catch issues unit tests can't (real network calls, real browser rendering, real navigation).

React Testing Library's philosophy I actually follow: test components the way a USER would use them — query by visible text/role/label, not by internal class names or state — because it means tests don't break on harmless refactors and actually catch real usage bugs. I haven't set up a full E2E suite yet in my current projects, but do write RTL-based tests for critical form validation logic (like admission form fields) where a silent regression would be costly.`,
  },
  {
    id: 30,
    question: 'If you were designing a large-scale React app from scratch today, what architecture/state-management decisions would you make and why?',
    answer: `My approach, broken down by concern:

• Framework — Next.js App Router, for file-based routing, built-in Server Components, image/font optimization, and easy API routes without a separate backend for simple needs.

• Server vs Client split — keep as much as possible as Server Components (data fetching, static layout), mark only genuinely interactive leaves as Client Components — smaller client bundle, faster initial load.

• Global state — avoid one giant global store for everything. Split by concern:
  – Auth/user/theme → Context API (rarely changes) or a lightweight store like Zustand.
  – Server data (lists, records) → React Query/TanStack Query instead of manually storing server data in Redux — handles caching, refetching, loading/error states out of the box, avoids "syncing server state into client state" bugs.
  – Complex local UI state (multi-step forms, wizards) → useReducer locally, not global state at all.

• Component structure — composition-first (children/slots), small focused components, colocate styles/logic per feature folder rather than one giant "components" dump.

• Performance — virtualization for large lists from day one if scale is expected, React.memo added only after profiling shows a real need, code-split heavy non-critical routes/components upfront.

• Testing — RTL for critical business logic (forms, validation, permission-gated UI), Playwright for the 4-5 most critical user journeys (signup, checkout, core workflow) rather than trying to E2E-test everything.

This is close to how I've evolved my approach across the school management app and Bright Owl — starting simpler (just Context) and introducing tools like React Query or Zustand only once a real pain point (server-state syncing bugs, prop drilling across many components) actually showed up, rather than over-engineering from day one.`,
  },
];

/* -------------------- TAB 2: ADVANCED -------------------- */
const ADVANCED_QUESTIONS = [
  {
    id: 1,
    question: "What's new in React 19 / recent React versions?",
    answer: `React 19 brought several notable changes:

• React Compiler (earlier "React Forget") — auto-memoizes components/values at build time, so manual useMemo/useCallback usage reduces a lot.
• Actions — functions that handle async transitions (form submits, pending/error states) natively, tied to useTransition.
• New hooks — useActionState, useFormStatus, useOptimistic for form/async UI without extra libraries.
• use() API — lets you read promises/context conditionally inside render (not just top-level like other hooks).
• Improved Server Components support — better integration with Next.js App Router (RSC by default).
• ref as a prop — no more forwardRef needed for simple cases, ref can be passed like a normal prop now.

Practically, for Next.js projects I'm already benefiting from Server Components and Actions-style patterns for form handling.`,
  },
  {
    id: 2,
    question: 'What is React Compiler and how is it different from manual memoization?',
    answer: `React Compiler is a build-time tool that automatically figures out which values/components need memoization and inserts the equivalent of useMemo/useCallback/React.memo for you — without you writing them manually.

Difference from manual approach:
• Manual — developer decides where useMemo/useCallback is needed, easy to miss a spot or over-use it.
• Compiler — analyzes the component code and dependencies automatically, reduces boilerplate and human error.

It doesn't remove the need to understand re-renders — you still need to know why something needs memoization, but you write less optimization code by hand.`,
  },
  {
    id: 3,
    question: 'What is React Server Components (RSC) vs Client Components?',
    answer: `Server Components run only on the server, never ship their JS to the browser — good for data fetching, reducing bundle size.

Client Components ('use client') run in the browser, needed for interactivity — state, effects, event handlers, browser APIs.

Key rules:
• Server Components can import Client Components, not the other way around directly.
• You can't use useState/useEffect/onClick in a Server Component.

In Next.js App Router, I keep data-fetching heavy dashboard pages as Server Components and mark only interactive pieces (forms, modals, charts) as 'use client' to keep bundle size down.`,
  },
  {
    id: 4,
    question: 'How does React.memo work and when should you use it?',
    answer: `React.memo wraps a component and skips re-rendering it if its props haven't changed (shallow comparison).

const VideoCard = React.memo(function VideoCard({ video }) {
  return <div>{video.title}</div>;
});

Use it when:
• Component renders often but props usually stay the same
• Component is expensive to render (heavy list item, chart, etc.)

Avoid overusing it — shallow comparison itself has a cost, and it's useless if you're passing new object/array/function references every render (pair it with useMemo/useCallback). I applied this in the video reels component to stop all video cards re-rendering on unrelated parent state changes.`,
  },
  {
    id: 5,
    question: 'What is code splitting, lazy loading, and Suspense for performance?',
    answer: `Code splitting breaks the app bundle into smaller chunks loaded only when needed, instead of one huge bundle upfront — improves initial load time.

React.lazy() + Suspense:
const Dashboard = React.lazy(() => import('./Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>

In Next.js this is mostly automatic per route/page, but I've manually lazy-loaded heavy client-only pieces like PDF generators and chart libraries (Recharts) to keep the initial JS bundle light.`,
  },
  {
    id: 6,
    question: 'What causes unnecessary re-renders and how do you profile/fix them?',
    answer: `Common causes:
• Parent re-renders → all children re-render by default even with unchanged props
• Inline object/array/function creation in JSX on every render
• Context value changing every render (new object each time)
• Missing/incorrect keys in lists

How to find & fix:
• React DevTools Profiler — record and see which components re-render and why
• React.memo for pure presentational components
• useMemo/useCallback to keep stable references
• Split large components so only the part that changes re-renders
• Move state down closer to where it's used, instead of high up in the tree

I used the Profiler tab to catch the video reels re-render issue — parent state updates were re-rendering every video card, fixed with React.memo + stable callback refs.`,
  },
  {
    id: 7,
    question: 'What is virtualization (windowing) and when do you need it?',
    answer: `Virtualization renders only the list items currently visible in the viewport (plus a small buffer), instead of rendering hundreds/thousands of DOM nodes at once.

Libraries: react-window, react-virtualized, TanStack Virtual.

Needed when rendering large lists/tables — like a student attendance table with thousands of rows, or a long chat/reel feed — where rendering everything at once would freeze the UI and use a lot of memory.`,
  },
  {
    id: 8,
    question: 'What performance/bundle optimizations do you do in a Next.js + React app?',
    answer: `Key things I focus on:
• next/image for automatic image optimization/lazy loading instead of raw <img>
• next/dynamic or React.lazy for heavy, non-critical components (charts, PDF viewer)
• Server Components for data-heavy, non-interactive parts to cut client JS
• Avoiding unnecessary "use client" — keeping the client boundary as small as possible
• Memoization (React.memo/useMemo/useCallback) only where profiling shows real benefit, not everywhere
• Checking bundle size with @next/bundle-analyzer to catch accidentally large dependencies

This combination is what I use across the school management app and Bright Owl to keep dashboards fast even as data grows.`,
  },
];

/* -------------------- Accordion Item -------------------- */
function AccordionItem({ item, isOpen, onToggle }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const lines = item.answer.split('\n').filter((l) => l.trim() !== '');

  return (
    <div className={`${styles.item} ${isOpen ? styles.open : ''}`}>
      <button className={styles.question} onClick={onToggle} aria-expanded={isOpen}>
        <span className={styles.badge}>{String(item.id).padStart(2, '0')}</span>
        <span className={styles.questionText}>{item.question}</span>
        <FiChevronDown className={styles.chevron} aria-hidden="true" />
      </button>

      <div
        className={styles.answerWrap}
        style={{ height: `${height}px` }}
        aria-hidden={!isOpen}
      >
        <div className={styles.answerInner} ref={bodyRef}>
          <div className={styles.answerBody}>
            {lines.map((line, i) => {
              if (line.startsWith('•')) {
                return (
                  <div key={i} className={styles.bulletRow}>
                    <span className={styles.dot} aria-hidden="true" />
                    <p>{line.replace('•', '').trim()}</p>
                  </div>
                );
              }
              return <p key={i} className={styles.para}>{line}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main Component -------------------- */
export default function NodeJsQA() {
  const [activeTab, setActiveTab] = useState('simple'); // 'simple' | 'advanced'
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setOpenId(null); // tab switch pe accordion reset
  };

  const activeQuestions = activeTab === 'simple' ? SIMPLE_QUESTIONS : ADVANCED_QUESTIONS;

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <Link href="/" className={styles.back}>
          <FiArrowLeft size={15} />
          Back
        </Link>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={() => handleTabChange('simple')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: activeTab === 'simple' ? '1px solid #d97706' : '1px solid #444',
              background: activeTab === 'simple' ? '#d97706' : 'transparent',
              color: activeTab === 'simple' ? '#111' : '#ddd',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Simple
          </button>
          <button
            onClick={() => handleTabChange('advanced')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: activeTab === 'advanced' ? '1px solid #d97706' : '1px solid #444',
              background: activeTab === 'advanced' ? '#d97706' : 'transparent',
              color: activeTab === 'advanced' ? '#111' : '#ddd',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Advanced
          </button>
        </div>

        <div className={styles.list}>
          {activeQuestions.map((q) => (
            <AccordionItem
              key={q.id}
              item={q}
              isOpen={openId === q.id}
              onToggle={() => toggle(q.id)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}