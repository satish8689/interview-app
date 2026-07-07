'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from '../personal/personal.module.scss'; // reuse the same scss module (same classnames as PersonalQA)

const QUESTIONS = [
  {
    id: 1,
    question: 'What is React? Why do we use it?',
    answer: `React is a JavaScript library (not a full framework) made by Facebook for building user interfaces, mainly single-page applications. It's component-based — UI is broken into small, reusable pieces.

It uses a Virtual DOM to update only the changed parts of real DOM instead of re-rendering everything — this makes it fast.

I use React (mostly with Next.js) for all client dashboards — school management app, optical shop admin panel, Bright Owl — because component reusability saves a lot of time across pages.`,
  },
  {
    id: 2,
    question: 'What is Virtual DOM and how does it work?',
    answer: `Virtual DOM is a lightweight JS copy of the real DOM kept in memory. When state changes, React first updates this virtual copy, then compares it with the previous version using a process called "diffing", and finally updates only the changed parts in the real DOM — this is called "reconciliation".

Real DOM manipulation is slow, so this approach avoids unnecessary full-page re-renders.

Simple way I explain it: React never touches real DOM directly unless it's sure something actually changed.`,
  },
  {
    id: 3,
    question: 'What is the difference between State and Props?',
    answer: `Props are read-only data passed from parent to child component — child cannot modify them directly.

State is data managed inside the component itself — it can change over time (using useState) and triggers re-render when updated.

Simple rule I follow: props = "given from outside", state = "owned by this component". In Bright Owl's game components, score and level are state, but studentId passed from dashboard is a prop.`,
  },
  {
    id: 4,
    question: 'What are React Hooks? Name commonly used ones.',
    answer: `Hooks are functions that let you use state and other React features inside functional components, without writing class components.

Most commonly used:
- useState — for local state
- useEffect — for side effects (API calls, subscriptions)
- useContext — to consume context without prop drilling
- useRef — to access DOM elements or persist value without re-render
- useMemo / useCallback — for performance optimization

I use useState + useEffect in almost every component; useRef I used a lot in the video reels component to track current playing video element.`,
  },
  {
    id: 5,
    question: 'Explain useEffect and its dependency array.',
    answer: `useEffect runs side-effect code after render — like API calls, subscriptions, timers, or manually updating DOM.

Dependency array controls when it re-runs:
- [] → runs only once on mount
- [value] → runs when "value" changes
- no array → runs after every render

useEffect(() => {
  fetchStudentData(id);
}, [id]);

I got bitten by stale closure bugs in the video reels component because dependency array was missing a value — effect kept using old state. That was a good real lesson on why dependency array must be accurate.`,
  },
  {
    id: 6,
    question: 'What is the difference between Controlled and Uncontrolled components?',
    answer: `Controlled component: form input value is controlled by React state — every keystroke updates state via onChange.

<input value={name} onChange={(e) => setName(e.target.value)} />

Uncontrolled component: input manages its own value internally, React accesses it using a ref when needed, not on every change.

<input ref={inputRef} />

I use controlled components almost everywhere for validation (like Zod-based forms in school app), uncontrolled only for simple things like file inputs.`,
  },
  {
    id: 7,
    question: 'What is prop drilling and how do you avoid it?',
    answer: `Prop drilling means passing props through many layers of components just to reach a deeply nested child, even though middle components don't need that data themselves.

Ways to avoid it:
- Context API — share data globally without passing through every level
- State management libraries (Redux, Zustand)
- Component composition

I used Context API for logged-in user/auth data in admin panels — avoided passing "user" prop through 5-6 nested components.`,
  },
  {
    id: 8,
    question: 'What is the Context API?',
    answer: `Context API lets you share data across the component tree without manually passing props at every level.

Steps: create context → wrap components with Provider → consume with useContext.

const ThemeContext = createContext();
<ThemeContext.Provider value={theme}>...</ThemeContext.Provider>
const theme = useContext(ThemeContext);

I used this for theme/design system values (dark brown/orange palette) in Bright Owl so every component gets consistent colors without prop passing.`,
  },
  {
    id: 9,
    question: 'What is the difference between useMemo and useCallback?',
    answer: `Both are used for performance optimization by avoiding unnecessary recalculation/re-creation on every render.

useMemo — memoizes a computed value:
const total = useMemo(() => calculateTotal(items), [items]);

useCallback — memoizes a function itself:
const handleClick = useCallback(() => doSomething(id), [id]);

Simple way I remember: useMemo → for values, useCallback → for functions. I used useCallback in the video reels component to prevent child video player from re-rendering unnecessarily on every parent state change.`,
  },
  {
    id: 10,
    question: 'What are Keys in React lists and why are they important?',
    answer: `Key is a special prop used when rendering lists — it helps React identify which items changed, got added, or removed, so it updates DOM efficiently instead of re-rendering the whole list.

{students.map((s) => <StudentCard key={s.id} data={s} />)}

Never use array index as key if list order can change (like after sorting/filtering) — it causes bugs where wrong item's state gets shown. I faced this exact bug once in a customer list with edit functionality — index-based key was showing wrong customer's data after delete.`,
  },
  {
    id: 11,
    question: 'What is the difference between useState and useRef?',
    answer: `useState — updating it causes component to re-render, used for values that affect UI.

useRef — updating it does NOT cause re-render, used to persist a value across renders or to directly access a DOM element.

const videoRef = useRef(null);
videoRef.current.play();

I use useRef a lot for things like tracking previous value, storing timers/intervals, or referencing video/audio elements — like in speech-based story practice module where I needed direct access to audio element.`,
  },
  {
    id: 12,
    question: 'What is React reconciliation and the diffing algorithm?',
    answer: `Reconciliation is the process React uses to update the real DOM efficiently when state/props change. It compares (diffs) the new Virtual DOM tree with the previous one.

Key rules React follows:
- Different element types → React destroys old tree, builds new one
- Same element type → React keeps the DOM node, updates only changed attributes
- Lists use "key" prop to match items between renders

This is why keeping stable component structure and proper keys matters — it directly affects performance in large lists like student/attendance tables.`,
  },
  {
    id: 13,
    question: 'What is code splitting / lazy loading in React?',
    answer: `Code splitting means breaking your app bundle into smaller chunks that load only when needed, instead of loading everything upfront — improves initial load time.

React.lazy() + Suspense is the common way:
const Dashboard = React.lazy(() => import('./Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>

In Next.js, this is mostly handled automatically per-page, but I've also manually lazy-loaded heavy components like PDF generator and chart libraries (Recharts) to keep initial bundle light.`,
  },
  {
    id: 14,
    question: 'What are Higher-Order Components (HOC) and Custom Hooks? When to use which?',
    answer: `HOC is a function that takes a component and returns a new enhanced component — used to share logic between components.

const withAuth = (Component) => (props) => {
  // check auth logic
  return <Component {...props} />;
};

Custom Hook is a function starting with "use" that extracts reusable stateful logic.

function useAuth() {
  const [user, setUser] = useState(null);
  // logic here
  return user;
}

In practice, I prefer custom hooks over HOCs now — cleaner syntax, no wrapper hell. I built a custom useSpeechRecognition hook once to reuse Web Speech API logic across multiple Bright Owl components.`,
  },
  {
    id: 15,
    question: 'What causes unnecessary re-renders in React and how do you prevent them?',
    answer: `Common causes:
- Parent re-renders → all children re-render by default, even if their props didn't change
- Creating new object/array/function inline on every render (like passing () => {} directly in JSX)
- Not using key correctly in lists
- Context value changing on every render (new object each time)

Prevention:
- React.memo() to skip re-render if props are same
- useCallback / useMemo to keep stable references
- Splitting components so only the part that actually needs update re-renders

I dealt with this exact performance issue in the video reels component — parent state update was re-rendering all video items on screen, fixed it using React.memo on individual video card component.`,
  },
];

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

export default function NodeJsQA() {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <Link href="/interviewprep" className={styles.back}>
          <FiArrowLeft size={15} />
          Back
        </Link>

        <div className={styles.header}>
          <span className={styles.headerEyebrow}>Interview preparation</span>
          <h1 className={styles.headerTitle}>Node.js — Event Loop &amp; Concurrency</h1>
          <p className={styles.headerSub}>
            {QUESTIONS.length} questions — click to reveal answers
          </p>
        </div>

        <div className={styles.list}>
          {QUESTIONS.map((q) => (
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