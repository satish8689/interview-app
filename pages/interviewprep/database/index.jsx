'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from '../personal/personal.module.scss'; // reuse same scss module as PersonalQA / NodeJsQA

/* ------------------------------------------------------------------ */
/* SQL DB QUESTIONS                                                    */
/* ------------------------------------------------------------------ */
const SQL_QUESTIONS = [
  {
    id: 1,
    question: 'What is the difference between WHERE and HAVING?',
    answer: `WHERE filters rows BEFORE grouping — it works on individual rows and cannot use aggregate functions (SUM, COUNT, AVG).

HAVING filters groups AFTER GROUP BY — it works on aggregated results.

SELECT teacher_id, COUNT(*) FROM attendance
WHERE status = 'present'
GROUP BY teacher_id
HAVING COUNT(*) > 20;

Simple rule I use: WHERE = row-level filter, HAVING = group-level filter. In the school app attendance reports, I use WHERE to filter by date range and HAVING to only show teachers with more than X present days.`,
  },
  {
    id: 2,
    question: 'Difference between DISTINCT, UNIQUE constraint, and PRIMARY KEY?',
    answer: `DISTINCT — a query keyword, removes duplicate rows from the result set. It's not a schema-level thing, just applies at query time.

SELECT DISTINCT city FROM students;

UNIQUE constraint — a schema-level rule on a column ensuring no two rows have the same value. Allows one NULL (in MySQL, multiple NULLs allowed since NULL != NULL).

email VARCHAR(100) UNIQUE

PRIMARY KEY — combination of UNIQUE + NOT NULL, and it's used to uniquely identify each row in the table. A table can have only ONE primary key, but multiple UNIQUE constraints.

id INT PRIMARY KEY AUTO_INCREMENT

Simple way I explain it: DISTINCT removes duplicates in output, UNIQUE prevents duplicates in storage, PRIMARY KEY = UNIQUE + NOT NULL + main row identifier + used for relationships (foreign keys point to it).`,
  },
  {
    id: 3,
    question: 'What is a Primary Key vs Foreign Key?',
    answer: `Primary Key — uniquely identifies each row in its own table, cannot be NULL, only one per table (can be composite — multiple columns together).

Foreign Key — a column in one table that references the Primary Key of another table, used to maintain relationships between tables.

CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

In the school management system, teachers.id is primary key, and attendance.teacher_id is foreign key — this enforces that attendance can't be inserted for a teacher_id that doesn't exist.`,
  },
  {
    id: 4,
    question: 'What are the different types of JOINs?',
    answer: `INNER JOIN — only matching rows from both tables.
LEFT JOIN — all rows from left table + matched rows from right (unmatched = NULL).
RIGHT JOIN — all rows from right table + matched from left.
FULL OUTER JOIN — all rows from both (MySQL doesn't support directly, simulate with UNION of LEFT + RIGHT).
SELF JOIN — table joined with itself.

SELECT t.name, a.check_in FROM teachers t
LEFT JOIN attendance a ON t.id = a.teacher_id;

I use LEFT JOIN most in reports — like showing all teachers even if some have no attendance record for that day.`,
  },
  {
    id: 5,
    question: 'What is normalization? Explain 1NF, 2NF, 3NF briefly.',
    answer: `Normalization is organizing DB schema to reduce data redundancy and avoid update/insert/delete anomalies, by splitting data into related tables.

1NF — each column has atomic (indivisible) values, no repeating groups.
2NF — 1NF + no partial dependency (every non-key column depends on the WHOLE primary key, relevant for composite keys).
3NF — 2NF + no transitive dependency (non-key columns shouldn't depend on other non-key columns).

Practical example: instead of storing teacher_name directly in attendance table, I store teacher_id and keep name in teachers table — avoids repeating the name in every attendance row and avoids update anomalies if name changes.`,
  },
  {
    id: 6,
    question: 'What is an index and how does it improve performance?',
    answer: `An index is a separate data structure (usually B-Tree) that stores column values in sorted order along with pointers to actual rows — lets the DB find rows fast without scanning the full table.

CREATE INDEX idx_teacher_date ON attendance(teacher_id, date);

Without index → full table scan O(n). With index → lookup close to O(log n).

Trade-off: indexes speed up SELECT but slow down INSERT/UPDATE/DELETE (index also needs updating) and take extra storage. I added a composite index on (teacher_id, date) in attendance table once daily reports started getting slow with growing rows.`,
  },
  {
    id: 7,
    question: 'Difference between clustered and non-clustered index?',
    answer: `Clustered index — determines the physical order of data in the table. Table data is stored sorted by this index. Only one per table (usually the primary key in MySQL/InnoDB).

Non-clustered index — a separate structure that just stores pointers to the actual row location. A table can have many non-clustered indexes.

In InnoDB (MySQL default engine), primary key IS the clustered index, and any other index you create is non-clustered and internally stores the primary key value as pointer.`,
  },
  {
    id: 8,
    question: 'What are ACID properties?',
    answer: `Atomicity — all operations in a transaction succeed, or none do (all-or-nothing).
Consistency — DB moves from one valid state to another, constraints are never violated.
Isolation — concurrent transactions don't interfere with each other's intermediate state.
Durability — once committed, data survives even after a crash.

START TRANSACTION;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;

If the app crashes after the first UPDATE but before COMMIT, atomicity ensures the first update also gets rolled back.`,
  },
  {
    id: 9,
    question: 'What is a transaction? Explain COMMIT and ROLLBACK.',
    answer: `A transaction is a group of SQL statements executed as a single unit — either all succeed or all fail.

START TRANSACTION → begins it.
COMMIT → saves all changes permanently.
ROLLBACK → undoes all changes if something goes wrong.

try {
  await query('START TRANSACTION');
  await query('INSERT INTO orders ...');
  await query('UPDATE inventory ...');
  await query('COMMIT');
} catch (err) {
  await query('ROLLBACK');
}

I use this pattern in Sahaj Optical order creation — inserting order + updating stock count must both succeed together, otherwise rollback so stock doesn't get wrongly decremented.`,
  },
  {
    id: 10,
    question: 'Difference between DELETE, TRUNCATE, and DROP?',
    answer: `DELETE — removes rows one by one (can use WHERE), logged, can be rolled back inside a transaction, slower on large tables, triggers fire.

TRUNCATE — removes ALL rows at once, resets AUTO_INCREMENT, faster (doesn't log each row), can't use WHERE, generally can't be rolled back.

DROP — removes the entire table structure + data, table no longer exists.

Quick rule: DELETE = remove some/all rows (table stays), TRUNCATE = empty the table fast (table stays), DROP = delete the table itself.`,
  },
  {
    id: 11,
    question: 'Difference between UNION and UNION ALL?',
    answer: `UNION — combines result sets of two queries and removes duplicate rows (does an implicit DISTINCT, so it's slower).

UNION ALL — combines result sets and keeps duplicates (faster, no dedup step).

SELECT name FROM teachers
UNION ALL
SELECT name FROM admins;

I use UNION ALL by default unless duplicates genuinely need to be removed, since it avoids the extra sorting/dedup cost.`,
  },
  {
    id: 12,
    question: 'Stored procedure vs function — what\'s the difference?',
    answer: `Stored Procedure — a saved block of SQL that can perform actions (INSERT/UPDATE/DELETE), can return zero, one, or multiple values, called with CALL.

Function — must return a single value, can be used directly inside a SELECT statement, generally can't modify data.

CALL GetTeacherAttendance(101);
SELECT CalculateAge(dob) FROM students;

Honestly in my day-to-day work I keep this logic in the Node.js backend instead of stored procedures — easier to version control, test, and debug compared to DB-side logic.`,
  },
  {
    id: 13,
    question: 'What is denormalization and when do you use it?',
    answer: `Denormalization is intentionally adding redundant data (or combining tables) to reduce JOINs and improve read performance, at the cost of some data duplication.

Example: storing teacher_name directly in an attendance_log table (instead of only teacher_id) so read-heavy reports don't need a JOIN every time.

I use this carefully — only for high-read, low-write tables like dashboards/reports, and only after normal design starts causing real performance issues, not by default.`,
  },
  {
    id: 14,
    question: 'How did you fix an AUTO_INCREMENT = 0 bug in production?',
    answer: `Faced this exact issue in the Sahaj Optical order system — new orders were getting inserted with order_id = 0 instead of an incrementing value.

Root cause: the insert query was explicitly passing 0 (or an empty string that MySQL coerced to 0) for the id column instead of omitting it, so MySQL used the given value instead of auto-incrementing.

Fix: removed id from the INSERT column list entirely (let AUTO_INCREMENT handle it), and ran:
ALTER TABLE orders AUTO_INCREMENT = <max_existing_id + 1>;
to correct the counter after cleaning up the bad 0-id rows.

Lesson: never pass id explicitly in an insert if the column is AUTO_INCREMENT, even as 0/null from a form default.`,
  },
];

/* ------------------------------------------------------------------ */
/* MONGODB QUESTIONS                                                   */
/* ------------------------------------------------------------------ */
const MONGO_QUESTIONS = [
  {
    id: 1,
    question: 'What is MongoDB and how is it different from SQL databases?',
    answer: `MongoDB is a NoSQL, document-oriented database — stores data as BSON (binary JSON) documents inside collections, instead of rows inside tables.

Key differences from SQL:
- Schema-less (flexible structure per document) vs fixed schema
- Documents can have nested objects/arrays vs normalized rows across tables
- Scales horizontally via sharding, easier than SQL
- No JOINs traditionally (has $lookup, but used sparingly)

I use MySQL for the school management app (structured, relational data like teachers/classes/attendance) but would reach for MongoDB for things like activity logs or flexible content structures where schema keeps changing.`,
  },
  {
    id: 2,
    question: 'What is the maximum size of a MongoDB database / document / collection?',
    answer: `Single document size limit — 16 MB max (BSON document limit). This is a hard limit, designed to prevent excessive memory use for a single document and keep it efficient to send over the wire.

Database size — no fixed hard limit, it depends on your storage engine, disk space, and OS file system limits (WiredTiger, the default engine, handles very large databases, into TBs, without issue).

Collection size — no fixed hard limit either (again, disk/storage bound), though very old MongoDB versions had a 32 TB check under some configs — not really relevant on modern versions.

Number of documents per collection — no limit (again, disk bound).

Practical takeaway: the ONE limit you'll actually hit in real projects is the 16MB per-document limit — which is exactly why large files (like videos, big images) can't be stored directly as a normal field.`,
  },
  {
    id: 3,
    question: 'How do you store images in MongoDB?',
    answer: `Three common approaches, depending on size:

1. Small images (under ~1MB) — store as Base64 string directly in the document field, or as BSON Binary (BinData) type. Simple, but bloats document size and slows down queries that don't need the image.

2. Large images / files over 16MB — use GridFS, MongoDB's built-in mechanism for storing large files. It splits files into small chunks (default 255KB each) across two collections: fs.files (metadata) and fs.chunks (binary chunks), and reassembles them on read.

const bucket = new GridFSBucket(db);
bucket.openUploadStream('photo.jpg').end(fileBuffer);

3. Best practice for most real apps (what I actually do) — DON'T store images in MongoDB at all. Store the image on external storage (AWS S3 / Cloudinary / local disk + CDN) and just save the URL/path as a string field in the MongoDB document. Faster reads, no document bloat, and DB backups stay small. I used this exact pattern for the YouTube Shorts importer feature — video/thumbnail on external storage, MySQL/Mongo just stores the URL.`,
  },
  {
    id: 4,
    question: 'What is a BSON document and what is ObjectId?',
    answer: `BSON (Binary JSON) is the binary-encoded format MongoDB uses internally to store documents — it's like JSON but supports extra types (Date, Binary, ObjectId) and is faster to parse/traverse than plain text JSON.

ObjectId is the default unique identifier MongoDB auto-generates for the _id field of every document — a 12-byte value encoding: 4 bytes timestamp + 5 bytes random/machine value + 3 bytes incrementing counter.

_id: ObjectId("64f1a2b3c4d5e6f7a8b9c0d1")

Useful side effect: since it embeds a timestamp, you can extract creation time directly from the ObjectId without a separate createdAt field.`,
  },
  {
    id: 5,
    question: 'Embedding vs Referencing — when to use which?',
    answer: `Embedding — nest related data directly inside the parent document (like SQL denormalization).

{ name: "John", address: { city: "Indore", pin: "452001" } }

Good for: one-to-few relationships, data always accessed together, data that doesn't change often independently.

Referencing — store just the ObjectId of the related document, similar to a foreign key.

{ name: "John", addressId: ObjectId("...") }

Good for: one-to-many/many-to-many, large sub-documents, data that changes frequently or is shared across many parents.

Rule of thumb I use: if related data is always read together and small → embed. If it's large, grows unbounded (like comments on a post), or reused elsewhere → reference.`,
  },
  {
    id: 6,
    question: 'What is an aggregation pipeline?',
    answer: `Aggregation pipeline processes documents through a sequence of stages, each transforming the data — similar to SQL's GROUP BY + JOIN + WHERE combined, but as a pipeline.

db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
]);

Common stages: $match (filter, like WHERE), $group (like GROUP BY), $sort, $project (select/reshape fields), $lookup (join-like operation), $limit.

It's the go-to tool for any non-trivial reporting/analytics query in MongoDB.`,
  },
  {
    id: 7,
    question: 'What is indexing in MongoDB and how do you create one?',
    answer: `Same core idea as SQL indexes — a B-Tree structure that avoids full collection scans (COLLSCAN) by letting Mongo jump directly to matching documents.

db.students.createIndex({ email: 1 }); // 1 = ascending, -1 = descending
db.students.createIndex({ teacherId: 1, date: -1 }); // compound index

_id always has a default index automatically. Use .explain("executionStats") to check if a query is actually using an index (IXSCAN) or doing a full scan (COLLSCAN) — I check this whenever a query feels slower than expected.`,
  },
  {
    id: 8,
    question: 'What is sharding in MongoDB?',
    answer: `Sharding is horizontal scaling — splitting a large collection's data across multiple servers (shards) based on a shard key, so no single server has to hold/process all the data.

Each shard holds a portion of data, a "mongos" router directs queries to the right shard(s), and "config servers" store the metadata about which data lives where.

Used when a single server can't handle the read/write load or data size anymore. For most of the project sizes I've worked on so far, a single properly-indexed replica set has been more than enough — sharding is more of a large-scale/enterprise concern.`,
  },
  {
    id: 9,
    question: 'What is a replica set?',
    answer: `A replica set is a group of MongoDB servers holding the same data — one Primary (handles all writes) and multiple Secondaries (replicate data from primary, can serve reads).

If the Primary goes down, the replica set automatically elects a new Primary from the Secondaries — this gives high availability and automatic failover, plus a safety net against data loss.

Different from sharding: replica set = same data copied on multiple servers (for redundancy), sharding = different data split across servers (for scale).`,
  },
  {
    id: 10,
    question: 'Difference between find() and findOne()?',
    answer: `find() — returns a cursor over ALL matching documents, you iterate/convert with .toArray().

db.students.find({ classId: 5 }).toArray();

findOne() — returns only the FIRST matching document as a plain object (or null if none found), no cursor needed.

db.students.findOne({ email: "a@x.com" });

I use findOne() for unique lookups (like checking if an email already exists) and find() whenever I expect/need a list of results.`,
  },
  {
    id: 11,
    question: 'What are MongoDB transactions?',
    answer: `Multi-document transactions let you group multiple operations (across one or more collections) into a single atomic unit — all succeed or all roll back, giving ACID guarantees similar to SQL transactions. Available from MongoDB 4.0+ (replica sets) and 4.2+ (sharded clusters).

const session = client.startSession();
session.startTransaction();
try {
  await orders.insertOne({...}, { session });
  await inventory.updateOne({...}, { $inc: { stock: -1 } }, { session });
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
}

Used less often than in SQL because Mongo's document model + embedding often avoids needing multi-document atomicity in the first place — a single document write is already atomic by default.`,
  },
  {
    id: 12,
    question: 'Difference between SQL JOIN and MongoDB $lookup?',
    answer: `SQL JOIN — a core relational operation, tables are designed assuming joins will happen often, generally fast because of the relational engine's optimization for it.

MongoDB $lookup — an aggregation stage that performs a left-outer-join-like operation between two collections, but it's meant to be used occasionally, not as the primary access pattern — Mongo's philosophy favors embedding data to avoid needing joins at all.

db.orders.aggregate([
  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } }
]);

Rule I follow: if I'm reaching for $lookup on every single query, that's usually a sign the schema should embed that data instead, or that SQL might've been the better fit for that data in the first place.`,
  },
];

/* ------------------------------------------------------------------ */
/* REDIS QUESTIONS                                                     */
/* ------------------------------------------------------------------ */
const REDIS_QUESTIONS = [
  {
    id: 1,
    question: 'What is Redis and why is it used?',
    answer: `Redis (REmote DIctionary Server) is an in-memory, key-value data store — data lives in RAM, not disk, which makes it extremely fast (sub-millisecond reads/writes).

Common uses: caching (reduce DB load), session storage, rate limiting, pub/sub messaging, leaderboards, real-time counters.

I'd use it in the school app to cache frequently-read, rarely-changed data like class lists or dashboard stats, instead of hitting MySQL on every request.`,
  },
  {
    id: 2,
    question: 'What are the main data types in Redis?',
    answer: `String — simple key-value, also used for counters (INCR/DECR).
List — ordered collection, good for queues (LPUSH/RPOP).
Set — unordered unique values (good for tags, unique visitor tracking).
Sorted Set (ZSET) — set with a score, auto-sorted — perfect for leaderboards.
Hash — field-value pairs under one key, like a mini object (good for storing a user record).

SET user:1:name "Satish"
HSET user:1 name "Satish" city "Indore"
ZADD leaderboard 500 "player1"

I'd use Hash for caching a full user/session object, and Sorted Set for something like a quiz leaderboard in Bright Owl.`,
  },
  {
    id: 3,
    question: 'How does Redis achieve such high speed?',
    answer: `Main reasons:
- Data stored entirely in RAM (no disk I/O on the read/write path)
- Single-threaded event loop for command execution — avoids context-switching/locking overhead (Redis 6+ added I/O threading for network only, core command execution is still single-threaded)
- Simple, efficient data structures (optimized C implementations)
- Uses non-blocking I/O

Trade-off: since data lives in RAM, dataset size is limited by available memory, and you need a persistence strategy (RDB/AOF) so data survives restarts.`,
  },
  {
    id: 4,
    question: 'What is TTL / expiry in Redis?',
    answer: `TTL (Time To Live) lets you set an expiration time on a key — after which Redis automatically deletes it. Useful for caching, sessions, OTPs, rate limiting.

SET otp:9876543210 "1234" EX 300   // expires in 300 seconds
TTL otp:9876543210                  // check remaining seconds
PERSIST otp:9876543210              // remove expiry

I'd use this for OTP verification in the WhatsApp/Telegram attendance bot flow — set OTP with a 5 minute TTL so it auto-invalidates without a manual cleanup job.`,
  },
  {
    id: 5,
    question: 'Difference between RDB and AOF persistence?',
    answer: `RDB (Redis Database) — takes periodic snapshots of the full dataset to disk (like a backup at intervals). Faster restarts, smaller file, but can lose the last few minutes of data if it crashes between snapshots.

AOF (Append Only File) — logs every write operation to a file, replayed on restart to rebuild state. More durable (configurable fsync — can lose as little as 1 second of data), but larger file size, slightly slower.

Many production setups use BOTH together for a balance of fast restart (RDB) and better durability (AOF).`,
  },
  {
    id: 6,
    question: 'What is Redis Pub/Sub?',
    answer: `Publish/Subscribe messaging pattern — a publisher sends messages to a "channel", and all subscribers listening to that channel receive it in real-time. Redis doesn't store the message — if no one's subscribed at that moment, the message is lost (fire-and-forget).

PUBLISH notifications "New attendance marked"
SUBSCRIBE notifications

Good for real-time features like live notifications or chat, but if you need guaranteed delivery/message persistence, Redis Streams or a proper message queue (RabbitMQ/Kafka) is a better fit.`,
  },
  {
    id: 7,
    question: 'What caching strategies have you used / would you use with Redis?',
    answer: `Cache-Aside (most common) — app checks Redis first; on a miss, reads from DB and writes result into Redis for next time.

const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
const data = await db.query(...);
await redis.set(key, JSON.stringify(data), 'EX', 3600);
return data;

Write-Through — write goes to cache and DB at the same time, keeps cache always fresh but adds write latency.

Write-Behind — write goes to cache first, DB updated asynchronously later — faster writes but riskier if cache fails before sync.

For most dashboard/report style data (like attendance stats), cache-aside with a reasonable TTL is what I'd reach for first — simple and effective.`,
  },
  {
    id: 8,
    question: 'What is cache invalidation and how do you handle it?',
    answer: `Cache invalidation means removing/updating cached data when the underlying source data changes, so the cache doesn't serve stale data.

Common approaches:
- TTL-based — simplest, just let it expire naturally after N seconds
- Explicit invalidation — delete/update the specific cache key right when the DB write happens
- Versioned keys — include a version number in the key, bump version on update instead of deleting

await db.update(teacherId, newData);
await redis.del(\`teacher:\${teacherId}\`); // invalidate on write

"There are only two hard things in Computer Science: cache invalidation and naming things" — very true in practice. I generally prefer explicit invalidation on writes over relying purely on TTL for data that must be accurate immediately (like attendance status).`,
  },
  {
    id: 9,
    question: 'Difference between Redis and Memcached?',
    answer: `Memcached — simple key-value store, strings only, multi-threaded, good for pure caching use cases, no persistence.

Redis — supports rich data types (List, Set, Hash, Sorted Set), persistence (RDB/AOF), replication, pub/sub, Lua scripting — much more than just a cache.

Rule of thumb: if you need ONLY simple caching and nothing else, Memcached's simpler. If you need caching + more advanced features (counters, leaderboards, pub/sub, persistence), Redis is the better default — which is why Redis is far more commonly used today.`,
  },
  {
    id: 10,
    question: 'What is Redis Cluster?',
    answer: `Redis Cluster is Redis's way of horizontally scaling — data is automatically split across multiple nodes using 16384 hash slots, each key maps to a slot via a hash function, and each node owns a subset of slots.

Gives you: more total memory/throughput than a single node, and built-in fault tolerance (each master can have replicas that take over on failure) — similar goal to MongoDB sharding + replica sets, just Redis's version of it.

For smaller apps a single Redis instance (maybe with one replica for failover) is usually enough — Cluster becomes relevant once dataset size or throughput outgrows a single node.`,
  },
];

const TABS = [
  { key: 'sql', label: 'SQL DB', data: SQL_QUESTIONS },
  { key: 'mongodb', label: 'MongoDB', data: MONGO_QUESTIONS },
  { key: 'redis', label: 'Redis', data: REDIS_QUESTIONS },
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

/* Inline tab-bar styles — kept local since no shared tab classnames exist
   in personal.module.scss yet. Swap for scss module classes if you add them. */
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

export default function DatabaseQA() {
  const [activeTab, setActiveTab] = useState('sql');
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