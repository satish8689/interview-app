'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from '../personal/personal.module.scss'; // reuse same scss module as PersonalQA / NodeJsQA / DatabaseQA / AwsQA

/* ------------------------------------------------------------------ */
/* ARCHITECTURE BASICS QUESTIONS                                       */
/* ------------------------------------------------------------------ */
const BASICS_QUESTIONS = [
  {
    id: 1,
    question: 'Monolithic vs Microservices architecture — what\'s the difference?',
    answer: `Monolith — the entire application (UI, business logic, DB access) is built and deployed as ONE single codebase/unit. Simple to develop and deploy early on, but as it grows, everything is tightly coupled — one bug can bring down the whole app, and scaling means scaling the whole thing even if only one part is under load.

Microservices — the app is split into small, independently deployable services, each owning its own logic (and often its own database), communicating over the network (REST/gRPC/queues).

Trade-off: microservices give independent scaling/deployment and fault isolation, but add real complexity — network calls instead of function calls, distributed data consistency, more infra to manage.

Every project I've worked on so far (school app, Sahaj Optical) has been a well-structured monolith — that's genuinely the right call at that scale. I'd only reach for microservices once a single team/codebase is clearly becoming a bottleneck, not by default.`,
  },
  {
    id: 2,
    question: 'Horizontal vs Vertical scaling — what\'s the difference?',
    answer: `Vertical Scaling ("scale up") — add more resources (CPU/RAM) to a single existing server. Simple, no architecture changes needed, but has a hard ceiling (biggest instance size available) and creates a single point of failure.

Horizontal Scaling ("scale out") — add MORE servers/instances running the same app, and distribute traffic across them (usually via a Load Balancer). No real ceiling, and gives redundancy (one instance dying doesn't take the app down), but requires the app to be stateless (or handle shared state properly) since requests can land on any instance.

Practical rule: start vertical (it's simpler) while traffic is small, move to horizontal once you're hitting the limits of a single machine or need redundancy — and design the app to be stateless early so that transition isn't a rewrite later.`,
  },
  {
    id: 3,
    question: 'What is a Load Balancer and why is it needed?',
    answer: `A Load Balancer sits between clients and your servers, distributing incoming requests across multiple backend instances — so no single server gets overwhelmed, and traffic keeps flowing even if one instance goes down (it stops routing to unhealthy instances via health checks).

Common algorithms: Round Robin (rotate evenly), Least Connections (send to the server with fewest active requests), IP Hash (same client consistently goes to the same server — useful for session stickiness).

Without a load balancer, scaling horizontally is pointless — you'd have multiple servers but no way to actually spread traffic across them. It's the piece that makes horizontal scaling actually work.`,
  },
  {
    id: 4,
    question: 'What does "stateless" vs "stateful" mean in architecture, and why does it matter?',
    answer: `Stateless — each request contains everything needed to process it; the server doesn't rely on data stored from a previous request in that server's own memory. Any server instance can handle any request.

Stateful — the server keeps request-specific data in memory between requests (e.g., session data stored locally on one server).

Why it matters: stateless services scale horizontally cleanly — a load balancer can send a request to any instance. Stateful services break under load balancing unless you add "sticky sessions" (pinning a client to one server) — which itself limits scaling and creates a weak point if that server goes down.

Practical fix I follow: keep session/user state in a shared store (Redis, DB) instead of server memory — then any instance can serve any request, and the app is genuinely stateless.`,
  },
  {
    id: 5,
    question: 'What is caching, and where can it live in a typical architecture?',
    answer: `Caching stores a copy of frequently-accessed or expensive-to-compute data somewhere faster to read from, so repeated requests don't redo the same expensive work (DB query, external API call, computation).

Layers where caching commonly happens, closest to user first:
- Browser cache — static assets cached on the client.
- CDN — cached content served from edge locations near the user.
- Application/in-memory cache (Redis/Memcached) — cached DB query results, computed values.
- Database query cache — some DBs cache repeated identical query results internally.

For a dashboard-style report that's expensive to compute but doesn't change every second, I'd cache it in Redis with a TTL, rather than hitting the DB fresh on every single request.`,
  },
  {
    id: 6,
    question: 'What is a CDN and why does it help performance?',
    answer: `A CDN (Content Delivery Network) is a network of geographically distributed servers ("edge locations") that cache and serve content closer to the end user, instead of every request traveling all the way to your origin server.

Benefits: lower latency (physically closer server), reduced load on the origin server (repeat requests served from cache), and built-in resilience against traffic spikes/some DDoS patterns since the origin isn't hit directly for cached content.

Typically used for static assets (images, JS/CSS, videos) — like putting CloudFront in front of an S3 bucket holding uploaded images, so users worldwide get fast load times instead of everyone hitting one server/region directly.`,
  },
  {
    id: 7,
    question: 'What is the difference between a Forward Proxy and a Reverse Proxy?',
    answer: `Forward Proxy — sits in front of CLIENTS, forwards their requests out to the internet on their behalf. The server being contacted doesn't know the real client, only sees the proxy. Common use: corporate networks controlling/anonymizing outbound employee traffic, bypassing regional restrictions.

Reverse Proxy — sits in front of SERVERS, receiving client requests and forwarding them to the appropriate backend server(s). The client only ever talks to the proxy, not the real backend directly. Common use: Nginx in front of a Node.js app — handles SSL termination, load balancing, serving static files, and hides backend server details from the outside world.

In basically every Node.js production setup I've deployed, Nginx sits in front as a reverse proxy — terminating HTTPS and forwarding requests to the app running on an internal port.`,
  },
  {
    id: 8,
    question: 'What is the difference between Latency and Throughput?',
    answer: `Latency — the time it takes for a SINGLE request to complete (send request → get response), usually measured in milliseconds. Lower is better.

Throughput — the number of requests a system can handle in a given time period (e.g., requests per second). Higher is better.

They're related but not the same — a system can have low latency (each request is fast) but low throughput (can't handle many at once), or the reverse. Example: a single powerful server might respond very fast (low latency) but fall over under high concurrent load (low throughput) — where horizontal scaling with a load balancer would raise throughput without necessarily changing per-request latency.

When debugging a "slow" system, I check both separately — is it one request being slow (latency issue — e.g., an unindexed query), or is it fine under light load but chokes under many concurrent users (throughput issue — needs scaling)?`,
  },
  {
    id: 9,
    question: 'Client-Server architecture — what is it, basically?',
    answer: `The most fundamental architecture pattern: a Client (browser, mobile app) sends requests, and a Server processes them and sends back a response — client and server are separate, communicating over a network (typically HTTP).

Client — handles presentation/UI, initiates requests.
Server — handles business logic, data storage/access, responds to requests.

Nearly every web app I've built follows this: a React/Next.js frontend (client) talking to a Node.js/Express backend (server) over REST APIs, with the server being the only thing that talks directly to the database — the client never touches the DB directly, which keeps data access controlled and secure.`,
  },
  {
    id: 10,
    question: 'What is database replication, and Master-Slave (Primary-Replica) setup?',
    answer: `Replication means keeping copies of the same data on multiple database servers, so reads (and sometimes writes) can be distributed, and there's redundancy if one server fails.

Primary (Master) — handles all WRITES, and replicates changes out to Replicas.
Replica (Slave) — receives copies of data from the Primary, typically serves READ-only queries.

This offloads read traffic from the Primary (most apps are read-heavy) and gives a failover option if the Primary goes down. Downside: replication lag — replicas can be slightly behind the Primary, so a write followed immediately by a read might not see that write yet if the read hits a lagging replica.

For a reporting-heavy feature like attendance analytics, I'd point those read queries at a replica instead of the primary DB, so heavy report queries don't slow down the actual write-heavy attendance-marking flow.`,
  },
  {
    id: 11,
    question: 'What is High Availability, and how is it different from Fault Tolerance?',
    answer: `High Availability (HA) — the system stays UP and accessible with minimal downtime, even when some component fails — typically achieved through redundancy (multiple instances/AZs) and automatic failover. Usually measured as a percentage of uptime (e.g., "99.9% availability").

Fault Tolerance — the system continues operating CORRECTLY (no incorrect results, no data loss) even during a failure, not just "still responding" — a stronger, more expensive guarantee, often requiring redundant processing of the same operation to catch/mask errors, not just redundant standby capacity.

Practical distinction: an HA setup might have a brief failover blip (a few seconds of errors while a new primary is elected) — acceptable for most apps. True fault tolerance (like in aviation/banking core systems) can't tolerate even that. Most business apps I've worked on target HA (Multi-AZ RDS, load-balanced instances), not full fault tolerance — the cost/complexity of true fault tolerance isn't justified at that scale.`,
  },
  {
    id: 12,
    question: 'What is a Single Point of Failure (SPOF), and how do you avoid one?',
    answer: `A Single Point of Failure is any one component whose failure brings down the entire system — e.g., one EC2 instance with no redundancy, one DB server with no replica, a load balancer with no standby.

Common ways to eliminate SPOFs: run multiple instances behind a Load Balancer (instead of one server), use Multi-AZ database setups with automatic failover, use managed services that have built-in redundancy (S3, RDS Multi-AZ), and avoid depending on any single server's local state.

When reviewing an architecture, I go through it component by component asking "if THIS one thing dies right now, does the whole app go down?" — that question alone finds most SPOFs before they become a 2am incident.`,
  },
];

/* ------------------------------------------------------------------ */
/* MID-LEVEL ARCHITECTURE QUESTIONS                                    */
/* ------------------------------------------------------------------ */
const MID_LEVEL_QUESTIONS = [
  {
    id: 1,
    question: 'What is the CAP theorem?',
    answer: `CAP theorem says a distributed system can only guarantee 2 out of these 3 at the same time, when a network partition happens:

Consistency — every read gets the most recent write (all nodes see the same data at the same time).
Availability — every request gets a response (success or failure), even if some nodes are down.
Partition Tolerance — the system keeps working even if network communication between nodes breaks down.

Since network partitions WILL happen in any real distributed system, the practical choice is really between CP (consistent but may reject requests during a partition — e.g., traditional RDBMS clusters) and AP (always responds, but might return slightly stale data — e.g., DynamoDB, Cassandra by default).

For something like attendance/order data where correctness matters more than always-on, I'd lean CP. For something like a "like count" or activity feed where slightly stale data is fine but the feature must never look "down," AP fits better.`,
  },
  {
    id: 2,
    question: 'Synchronous vs Asynchronous communication between services — when to use which?',
    answer: `Synchronous — Service A calls Service B and WAITS for the response before continuing (e.g., a direct REST API call). Simple to reason about, but couples the two services' availability and latency together — if B is slow/down, A is blocked too.

Asynchronous — Service A sends a message/event (usually via a queue like SQS, or an event bus) and moves on without waiting for B to process it immediately. B processes it whenever it's ready. Decouples the two services — A doesn't care if B is temporarily down, the message just waits in the queue.

Rule of thumb: use sync when the caller genuinely needs the result right now to proceed (e.g., "is this login valid?"). Use async for anything that can happen "eventually" without blocking the user (e.g., "send a confirmation email after order placed," "update analytics after an event").`,
  },
  {
    id: 3,
    question: 'What is Database Sharding, and how is it different from Replication?',
    answer: `Replication — copies the SAME data across multiple servers (for redundancy/read scaling) — every replica has the full dataset.

Sharding — splits DIFFERENT parts of the data across multiple servers (each shard holds a subset) — no single server has to hold or process the entire dataset, which is how you scale WRITES and total data size beyond what one server can handle.

Example: shard a giant "students" table by region — shard-1 holds students where region = 'North', shard-2 holds region = 'South', each shard is a separate DB instance. A query needs to know (via a shard key) which shard to hit.

Complexity it adds: cross-shard queries/JOINs become hard, and choosing the right shard key up front matters a lot — a bad shard key leads to uneven load ("hot shards"). I'd only reach for sharding once a single well-indexed DB instance genuinely can't handle the write volume or data size — it's a significant complexity jump, not a default choice.`,
  },
  {
    id: 4,
    question: 'What is Eventual Consistency?',
    answer: `Eventual consistency means that after a write, the system doesn't guarantee ALL nodes/replicas reflect that write immediately — but GIVEN ENOUGH TIME with no new writes, all nodes will eventually converge to the same, correct value.

Common in distributed/NoSQL systems (DynamoDB, Cassandra, and even MySQL read replicas) where prioritizing availability/performance over instant consistency is an intentional trade-off.

Example: you update your profile picture, and for a brief moment a friend viewing your profile from a different region/replica might still see the old picture — a few seconds later it's consistent everywhere.

Where I'd accept it: social feeds, view counts, non-critical cached data. Where I wouldn't: financial balances, seat/inventory reservations — those need strong consistency (or explicit locking/transactions), not "eventually correct."`,
  },
  {
    id: 5,
    question: 'What is the Circuit Breaker pattern, and why is it used?',
    answer: `A Circuit Breaker wraps calls to an external service/dependency and monitors for failures. If failures cross a threshold, the circuit "opens" — further calls fail FAST immediately (without even attempting the call) for a cooldown period, instead of letting every request hang/timeout against a service that's clearly down.

States: Closed (normal, calls go through) → Open (failing fast, not calling the dependency) → Half-Open (after cooldown, lets a few test calls through to check if the dependency recovered) → back to Closed if healthy, or Open again if not.

Why it matters: without this, a slow/dead downstream service (like a third-party payment API) can cause every request that depends on it to hang until timeout, exhausting your own server's threads/connections and taking YOUR service down too — a circuit breaker contains the blast radius instead of letting one failing dependency cascade into a full outage.`,
  },
  {
    id: 6,
    question: 'What is Idempotency, and why does it matter in API design?',
    answer: `An operation is idempotent if calling it multiple times with the same input produces the same result as calling it once — no extra side effects from repeated calls.

GET, PUT, DELETE — naturally idempotent by design (fetching, fully replacing, or deleting the same resource repeatedly leaves the same end state).
POST — NOT naturally idempotent (each call typically creates a new resource) — this is where real bugs happen, e.g., a flaky network causes the client to retry a "place order" POST request, accidentally creating two orders/charging twice.

Fix — use an Idempotency Key: client generates a unique key per logical operation, sends it with the request, server checks "have I already processed this key?" and returns the original result instead of redoing the action if it has.

I'd add idempotency keys to any payment/order-creation endpoint specifically because clients WILL retry on network errors — without it, a simple retry becomes a duplicate order or double charge.`,
  },
  {
    id: 7,
    question: 'What is Rate Limiting, and what are common strategies for it?',
    answer: `Rate limiting restricts how many requests a client can make in a given time window, protecting the system from being overwhelmed (whether from abuse, a bug causing a retry storm, or just one client hogging shared resources).

Common algorithms:
- Fixed Window — allow N requests per fixed time window (e.g., 100/minute), simple but can allow a burst right at the window boundary (200 requests across 2 seconds if timed at the edge of two windows).
- Sliding Window — smooths that boundary issue by considering a rolling time window instead of fixed buckets.
- Token Bucket — a bucket refills with tokens at a steady rate, each request consumes a token, allows some burst capacity up to the bucket size while enforcing an average rate over time — this is the most commonly used in practice (also used by AWS API Gateway itself).

I'd implement this using Redis (since it's fast and naturally supports TTL/atomic counters) — e.g., INCR a counter key per user/IP with a TTL matching the window, reject once it crosses the limit.`,
  },
  {
    id: 8,
    question: 'What is API Gateway pattern (in general system design, not just AWS)?',
    answer: `In a microservices architecture, instead of the client calling each individual service directly, an API Gateway sits as a single entry point in front of all of them — routing each request to the right backend service.

Benefits: client doesn't need to know about internal service topology (services can move/change without breaking clients), centralizes cross-cutting concerns (auth, rate limiting, logging, request/response transformation) instead of duplicating that logic in every service, and can aggregate multiple backend calls into one response for the client.

Trade-off: it becomes a critical piece of infra (needs to be highly available itself) and can become a bottleneck/single point of failure if not scaled properly — so it's usually deployed with redundancy just like any other critical service.`,
  },
  {
    id: 9,
    question: 'What is the Saga pattern for distributed transactions?',
    answer: `In a monolith with one DB, a multi-step operation can use a single ACID transaction (all-or-nothing). In microservices, each service typically owns its OWN database — so you can't wrap a multi-service operation in one traditional transaction.

The Saga pattern breaks that operation into a sequence of local transactions, one per service, where each step publishes an event triggering the next step. If a later step fails, the saga runs COMPENSATING transactions to undo the effects of the earlier steps (instead of a real rollback).

Example: "place order" saga — (1) Order service creates order → (2) Payment service charges card → (3) Inventory service reserves stock. If step 3 fails (out of stock), a compensating action refunds the payment (undoing step 2) and cancels the order (undoing step 1).

This is meaningfully more complex than a single DB transaction — I'd only reach for this once data genuinely lives in separate databases across services; if it's all in one DB, a normal transaction is simpler and should be preferred.`,
  },
  {
    id: 10,
    question: 'What is CQRS (Command Query Responsibility Segregation)?',
    answer: `CQRS separates the model used for WRITES (Commands — create/update/delete) from the model used for READS (Queries) — instead of using one single model/table structure for both.

Why: read and write patterns often have very different needs — writes need to enforce business rules/validation on a normalized structure, while reads often want fast, denormalized, pre-shaped data for a specific view (like a dashboard). Sometimes taken further with entirely separate read/write databases, kept in sync asynchronously (often paired with Event Sourcing).

Simple version I'd actually use in most projects: keep write operations going through the normal validated model, but maintain a separate denormalized "read view" (a materialized table, or a Redis-cached projection) specifically shaped for an expensive dashboard/report query — updated whenever the underlying write happens — rather than the full complexity of fully separate read/write databases, which is usually overkill outside large-scale systems.`,
  },
  {
    id: 11,
    question: 'What is Service Discovery, and why is it needed in microservices?',
    answer: `In a dynamic environment where service instances are constantly starting, stopping, scaling, or getting new IPs (containers, auto-scaling), hardcoding "Service B is at 10.0.1.5" breaks immediately. Service Discovery solves this by maintaining a live registry of "which instances of which service are currently available and healthy, at what address."

Client-side discovery — the calling service queries the registry directly and picks an instance itself.
Server-side discovery — the calling service just calls a fixed address (like a load balancer), and the load balancer/registry handles finding a healthy instance behind the scenes (more common in practice — e.g., AWS ALB + target groups, or Kubernetes Services, handle this transparently).

In most managed environments (like an AWS ALB with an Auto Scaling target group, or Kubernetes), this is handled by the platform automatically — you'd only build custom service discovery (e.g., via Consul/Eureka) in a more DIY/on-prem microservices setup.`,
  },
  {
    id: 12,
    question: 'How do you approach designing the architecture for a new medium-scale project?',
    answer: `My general approach, roughly in order:

1. Start with a clear, well-structured monolith unless there's a specific known reason for microservices from day one — most projects don't have the team size or scale to justify the added complexity yet.

2. Design the DB schema properly upfront (normalization, indexes on obvious query patterns) — this is the piece that's hardest to fix later without real pain.

3. Keep the app stateless from the start (sessions in Redis/DB, not server memory) — costs nothing now, saves a rewrite later when horizontal scaling becomes necessary.

4. Put a reverse proxy (Nginx) in front early, even for a single instance — makes adding SSL, a second instance, or a load balancer later a config change, not an architecture change.

5. Identify the 1–2 genuinely heavy operations (report generation, file processing, search) and design those specifically for async/caching/offloading (queue + worker, or a Lambda-style trigger) rather than assuming the simple synchronous path will hold up.

6. Add monitoring/logging (even basic CloudWatch-style dashboards + alerts) before it's needed, not after the first production incident.

Basically: build the simplest thing that's correct and stateless, but make the handful of decisions upfront (schema, statelessness, proxy layer) that are cheap now and expensive to retrofit later.`,
  },
];

const TABS = [
  { key: 'basics', label: 'Basics', data: BASICS_QUESTIONS },
  { key: 'mid', label: 'Mid-Level', data: MID_LEVEL_QUESTIONS },
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

/* Inline tab-bar styles — kept local to match the same pattern used in
   DatabaseQA / AwsQA. Swap for scss module classes if you add shared tab styles. */
const tabBarStyle = {
  display: 'flex',
  gap: '8px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const tabBtnStyle = (active) => ({
  padding: '8px 18px',
  borderRadius: '999px',
  border: active ? '1px solid transparent' : '1px solid #ddd',
  background: active ? '#7c3f1d' : '#fff', // matches dark-brown/orange palette from Bright Owl
  color: active ? '#fff' : '#333',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

export default function ArchitectureQA() {
  const [activeTab, setActiveTab] = useState('basics');
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  const handleTabChange = (key) => {
    setActiveTab(key);
    setOpenId(null); // close open accordion when switching tab
  };

  const activeQuestions = TABS.find((t) => t.key === activeTab)?.data ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <Link href="/" className={styles.back}>
          <FiArrowLeft size={15} />
          Back
        </Link>

        <div style={tabBarStyle}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              style={tabBtnStyle(activeTab === tab.key)}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {activeQuestions.map((q) => (
            <AccordionItem
              key={`${activeTab}-${q.id}`}
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