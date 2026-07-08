'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from '../personal/personal.module.scss'; // reuse the same scss module (same classnames as PersonalQA)

const QUESTIONS = [
  {
    id: 1,
    question: 'What is GraphQL? How is it different from REST?',
    answer: `GraphQL is a query language for APIs, created by Facebook. Instead of hitting multiple REST endpoints, client sends one query and gets exactly the data it needs — nothing more, nothing less.

In REST, we often face over-fetching (extra unwanted data) or under-fetching (need multiple calls). GraphQL solves both — single endpoint, single request, exact shape of data.

I used this heavily in Bright Owl app where dashboard needed nested data (student + progress + games) — one GraphQL query replaced 3-4 REST calls.`,
  },
  {
    id: 2,
    question: 'What are Schema and Types in GraphQL?',
    answer: `Schema is the contract between client and server — it defines what queries, mutations, and types are available. It's written using SDL (Schema Definition Language).

Types define the shape of data, like:
type User {
  id: ID!
  name: String!
  email: String
}

! means required (non-nullable). This schema-first approach forces you to think about data structure before writing resolvers — helped me a lot in planning APIs cleanly.`,
  },
  {
    id: 3,
    question: 'What is a Resolver in GraphQL?',
    answer: `Resolver is just a function that returns data for a specific field in schema. Every field can have its own resolver.

Signature is: (parent, args, context, info) => data

- parent: result from parent resolver
- args: arguments passed in query
- context: shared data like DB connection, logged-in user (available across all resolvers)
- info: query metadata (rarely used)

In real projects, I write resolvers that call service/DB layer — resolver itself stays thin, just orchestration logic.`,
  },
  {
    id: 4,
    question: 'What is the difference between Query and Mutation?',
    answer: `Query is for reading data (like GET in REST) — it doesn't change anything on server.

Mutation is for writing data — create, update, delete (like POST/PUT/DELETE in REST).

Example:
type Query {
  getStudent(id: ID!): Student
}
type Mutation {
  addStudent(name: String!): Student
}

Rule of thumb I follow: if it changes DB state, it's a mutation — no exceptions, keeps code predictable for team.`,
  },
  {
    id: 5,
    question: 'What is Over-fetching and Under-fetching? How does GraphQL solve it?',
    answer: `Over-fetching = API returns more data than needed (e.g., REST /user returns 20 fields but UI needs only 3).

Under-fetching = one API call is not enough, so you call multiple endpoints to get all required data.

GraphQL solves both because client specifies exact fields it wants in the query itself. I faced this real problem in optical shop admin panel — REST customer API was returning full object with prescriptions, invoices etc, but card view needed just name and phone. Switching that module's data-fetch logic to GraphQL-style selection reduced payload size a lot.`,
  },
  {
    id: 6,
    question: 'What are Scalar types in GraphQL?',
    answer: `Scalars are the basic built-in data types that hold a single value:
- Int
- Float
- String
- Boolean
- ID (unique identifier, serialized as String)

We can also create Custom Scalars, like Date or Email, when built-in types are not enough. I created a custom DateTime scalar once for attendance records so date format stays consistent across app.`,
  },
  {
    id: 7,
    question: 'What is a GraphQL Fragment?',
    answer: `Fragment is a reusable piece of query — lets you define a set of fields once and use it in multiple queries/mutations.

Example:
fragment StudentInfo on Student {
  id
  name
  class
}

query {
  getStudent(id: 1) {
    ...StudentInfo
  }
}

Very useful when same fields are needed in many queries — avoids repeating same field list again and again, keeps queries clean.`,
  },
  {
    id: 8,
    question: 'What is the N+1 problem in GraphQL and how do you fix it?',
    answer: `N+1 problem happens when fetching a list triggers one query for the list, then N more queries — one for each item's related data. Example: get 50 students (1 query), then for each student separately query their attendance (50 more queries) = 51 total queries. Very bad for performance.

Fix: use DataLoader — it batches and caches requests, so instead of 50 separate DB calls, it makes 1 batched call.

I hit this exact issue in school management app when loading teacher list with their attendance summary together — DataLoader fixed the slow response time.`,
  },
  {
    id: 9,
    question: 'What is Context in GraphQL (Apollo Server)?',
    answer: `Context is an object shared across all resolvers in a single request. It's usually used to pass things like:
- authenticated user info
- DB connection instance
- request headers

It's created once per request in the server setup:
context: ({ req }) => ({ user: getUserFromToken(req) })

I use context to pass logged-in user data so every resolver can check permissions without re-fetching auth info again and again.`,
  },
  {
    id: 10,
    question: 'What are Subscriptions in GraphQL?',
    answer: `Subscriptions allow real-time updates — client subscribes to an event, and server pushes data whenever that event happens. Uses WebSocket connection instead of normal HTTP request-response.

Example use case: live notification, chat message, live order status update.

I haven't used subscriptions in production yet, but conceptually it's similar to Socket.io — server "publishes" event, subscribed clients "listen" and get pushed data automatically.`,
  },
  {
    id: 11,
    question: 'What is Apollo Client / Apollo Server?',
    answer: `Apollo Server is a library to build GraphQL API on backend (Node.js) — handles schema, resolvers, and request execution.

Apollo Client is used on frontend (React/Next.js) to send queries/mutations and manage caching automatically. Hooks like useQuery and useMutation make it very easy to fetch and update UI.

Example:
const { data, loading, error } = useQuery(GET_STUDENTS);

I've mostly worked with Apollo Client's caching feature — it auto-updates UI when mutation changes related data, no manual refetch needed most of the time.`,
  },
  {
    id: 12,
    question: 'How does Error Handling work in GraphQL?',
    answer: `Unlike REST (which uses HTTP status codes), GraphQL always returns 200 OK status — errors come inside an "errors" array in response body, alongside "data".

Response looks like:
{
  "data": { "getStudent": null },
  "errors": [{ "message": "Student not found" }]
}

In resolvers, we throw custom errors like:
throw new GraphQLError('Student not found', { extensions: { code: 'NOT_FOUND' } });

This took me time to get used to initially since REST habit is checking status code — in GraphQL you always check the errors array.`,
  },
  {
    id: 13,
    question: 'What is Introspection in GraphQL?',
    answer: `Introspection means GraphQL API can describe its own schema — client can query what types, fields, and operations are available, without reading external docs.

This is exactly how tools like GraphQL Playground / Apollo Studio auto-generate documentation and give autocomplete suggestions.

In production, introspection is usually disabled for security — you don't want to expose full schema structure publicly to unknown clients.`,
  },
  {
    id: 14,
    question: 'What is the difference between GraphQL and REST in terms of versioning?',
    answer: `REST APIs often need versioning (v1, v2) because changing response structure can break existing clients.

GraphQL avoids versioning — you can add new fields/types anytime without breaking old queries, since client only asks for fields it needs. Old fields can be marked @deprecated instead of removing them suddenly.

This is a big advantage when app is evolving fast — like Bright Owl app where I kept adding new fields to Student type without touching old mobile app queries.`,
  },
  {
    id: 15,
    question: 'Can GraphQL replace REST completely? When would you still use REST?',
    answer: `No, not always — depends on project needs.

GraphQL is great when: frontend needs flexible data shape, multiple clients (web/mobile) need different fields, nested/related data fetching is common.

REST is still better/simpler when: simple CRUD APIs, file upload/download, caching via HTTP/CDN is important (GraphQL caching is trickier), or team/project is small and doesn't need that flexibility.

In real projects I choose based on complexity — simple admin panels I still build with REST + Next.js API routes, but for apps with complex nested data (like Bright Owl's dashboard), GraphQL made more sense.`,
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

        <Link href="/" className={styles.back}>
          <FiArrowLeft size={15} />
          Back
        </Link>

        {/* <div className={styles.header}>
          <span className={styles.headerEyebrow}>Interview preparation</span>
          <h1 className={styles.headerTitle}>Node.js — Event Loop &amp; Concurrency</h1>
          <p className={styles.headerSub}>
            {QUESTIONS.length} questions — click to reveal answers
          </p>
        </div> */}

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