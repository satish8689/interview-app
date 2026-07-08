'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from '../personal/personal.module.scss'; // reuse same scss module as PersonalQA / NodeJsQA / DatabaseQA

/* ------------------------------------------------------------------ */
/* S3 QUESTIONS                                                        */
/* ------------------------------------------------------------------ */
const S3_QUESTIONS = [
  {
    id: 1,
    question: 'What is Amazon S3 and what is it used for?',
    answer: `S3 (Simple Storage Service) is an object storage service — you store files (objects) inside "buckets" instead of a traditional file system. Each object has a key (path-like name), the actual data, and metadata.

Common uses: storing images/videos/documents, static website hosting, backups, data lake storage, serving as the origin for a CDN (CloudFront).

I used this exact pattern for the YouTube Shorts importer feature — video/thumbnail files go straight to S3, and only the S3 URL gets saved in MySQL/Mongo instead of storing binary data in the DB.`,
  },
  {
    id: 2,
    question: 'What is a bucket, and are bucket names globally unique?',
    answer: `A bucket is the top-level container for objects in S3 — think of it like a root folder. Every object you upload lives inside some bucket.

Yes, bucket names must be globally unique across ALL of AWS (not just your account) — because S3 buckets can be addressed via a DNS-style URL like bucket-name.s3.amazonaws.com, and DNS names have to be unique.

Rules: lowercase letters, numbers, hyphens only, 3–63 characters, no uppercase, no underscores. I usually prefix bucket names with the project/company name to avoid clashing with someone else's bucket globally.`,
  },
  {
    id: 3,
    question: 'How do you control access to an S3 bucket/object?',
    answer: `A few layers, usually combined:

Bucket Policy — JSON policy attached to the bucket, controls who (which AWS principal) can do what (GetObject, PutObject, etc.) on the bucket/objects.

IAM Policy — attached to a user/role, controls what THAT identity can do across AWS, including S3.

ACLs (Access Control Lists) — older, object/bucket-level permissions, mostly discouraged now in favor of bucket policies + IAM.

Block Public Access — an account/bucket-level setting that overrides everything else to prevent accidental public exposure — AWS turned this ON by default for new buckets after a lot of public-data-leak incidents.

For most projects I keep buckets private and generate signed URLs (or serve through CloudFront) instead of making anything public directly.`,
  },
  {
    id: 4,
    question: 'What is a pre-signed URL and why would you use one?',
    answer: `A pre-signed URL is a temporary URL generated using your AWS credentials that grants time-limited access to a private S3 object — without making the bucket/object public.

const url = await getSignedUrl(s3Client, new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'invoices/order-123.pdf'
}), { expiresIn: 300 }); // valid for 5 minutes

Used it for letting users download/view private files (like generated invoices or uploaded documents) directly from the frontend without routing the actual file bytes through my Node.js server — saves bandwidth and server load.`,
  },
  {
    id: 5,
    question: 'What are S3 storage classes?',
    answer: `Different tiers trading cost vs retrieval speed/availability:

Standard — frequently accessed data, low latency, most expensive per GB.
Intelligent-Tiering — automatically moves objects between tiers based on access pattern, good when you don't know access frequency in advance.
Standard-IA / One Zone-IA — infrequent access, cheaper storage but a retrieval cost, One Zone is cheaper but less redundant (single AZ).
Glacier / Glacier Deep Archive — archival storage, very cheap, but retrieval takes minutes to hours — good for backups/compliance data you rarely touch.

Practical use: I'd set a lifecycle rule to move old order invoices to Glacier after 6 months instead of manually managing storage cost.`,
  },
  {
    id: 6,
    question: 'What is an S3 lifecycle policy?',
    answer: `A lifecycle policy automates moving or deleting objects based on age/rules — you don't have to manually clean up storage.

{
  "Rules": [{
    "Status": "Enabled",
    "Transitions": [{ "Days": 90, "StorageClass": "GLACIER" }],
    "Expiration": { "Days": 365 }
  }]
}

Example: move logs to Glacier after 90 days, and delete them entirely after a year — keeps storage costs predictable without a manual cleanup job.`,
  },
  {
    id: 7,
    question: 'How do you upload large files to S3 efficiently?',
    answer: `Multipart Upload — splits a large file into smaller parts, uploads them in parallel, and S3 reassembles them. Recommended for files over ~100MB, required above 5GB.

Benefits: parallel upload (faster), can retry a single failed part instead of restarting the whole upload, and can pause/resume.

const upload = new Upload({
  client: s3Client,
  params: { Bucket: 'my-bucket', Key: 'video.mp4', Body: fileStream }
}); // SDK's Upload class handles multipart automatically
await upload.done();

For the Shorts importer, videos are large enough that I let the AWS SDK's built-in multipart Upload helper handle chunking instead of writing that logic manually.`,
  },
  {
    id: 8,
    question: 'What is S3 versioning?',
    answer: `Versioning keeps multiple versions of an object in the same bucket — every PUT to the same key creates a new version instead of overwriting, and you can restore or reference any previous version.

Useful for: accidental overwrite/delete protection, audit trail of changes. Downside: storage cost adds up since old versions aren't auto-deleted (combine with a lifecycle rule to expire old versions after N days).

I'd enable this on buckets storing anything business-critical (like generated reports/invoices) but leave it off for pure temp/cache-style buckets to avoid unnecessary storage cost.`,
  },
  {
    id: 9,
    question: 'How does S3 achieve durability, and what does "11 nines" mean?',
    answer: `S3 Standard is designed for 99.999999999% durability ("11 nines") — meaning if you store 10,000,000 objects, you'd statistically expect to lose one object roughly every 10,000 years.

This comes from automatically replicating data across multiple Availability Zones (physically separate data centers) within a region, so losing one AZ doesn't lose your data.

Durability (will my data survive?) is different from availability (can I access it right now?) — S3 Standard also has high availability (99.99%), but the two numbers measure different things.`,
  },
  {
    id: 10,
    question: 'CORS issue with S3 — how have you debugged/fixed it?',
    answer: `Hit this when the frontend (running on one origin) tried to directly upload/fetch objects from an S3 bucket (different origin) — browser blocked it with a CORS error since S3 didn't have a CORS configuration allowing that origin.

Fix — added a CORS configuration on the bucket:

[{
  "AllowedOrigins": ["https://myapp.com"],
  "AllowedMethods": ["GET", "PUT", "POST"],
  "AllowedHeaders": ["*"]
}]

Lesson: CORS is a browser-side restriction, not a permissions issue — even with correct IAM/bucket policy, direct browser uploads to S3 will fail without an explicit CORS config on the bucket.`,
  },
];

/* ------------------------------------------------------------------ */
/* LAMBDA QUESTIONS                                                    */
/* ------------------------------------------------------------------ */
const LAMBDA_QUESTIONS = [
  {
    id: 1,
    question: 'What is AWS Lambda and how is it different from EC2?',
    answer: `Lambda is a serverless, event-driven compute service — you upload code (a function), and AWS runs it in response to triggers (API call, S3 upload, schedule, queue message) without you provisioning or managing any server.

EC2 — you manage the whole server (OS, scaling, patching, uptime), it runs continuously whether or not it's handling requests, you pay per hour/second the instance is running.

Lambda — no server management, scales automatically (including down to zero), you pay only for actual execution time (per ms) + requests, but has execution time limits (15 min max) and less control over the runtime environment.

Rule of thumb: short, event-triggered, bursty workloads → Lambda. Long-running, stateful, or needs full OS control → EC2.`,
  },
  {
    id: 2,
    question: 'What triggers a Lambda function?',
    answer: `Lambda can be invoked by many event sources:

- API Gateway — HTTP request hits an endpoint, triggers Lambda (common for serverless APIs)
- S3 — file uploaded/deleted in a bucket
- SQS/SNS — message arrives in a queue/topic
- EventBridge (CloudWatch Events) — scheduled (cron-like) or event-pattern based
- DynamoDB Streams — a table's data changes

exports.handler = async (event) => {
  // event shape differs based on trigger source
  const bucket = event.Records[0].s3.bucket.name;
};

I'd use an S3 trigger to auto-generate a thumbnail whenever a new video is uploaded, instead of doing that processing synchronously in the main Node.js server.`,
  },
  {
    id: 3,
    question: 'What is "cold start" in Lambda?',
    answer: `A cold start happens when Lambda has to spin up a brand-new execution environment for a function that hasn't run recently (or is scaling up) — this involves downloading code, initializing the runtime, and running any top-level init code, adding extra latency to that first request.

A warm start reuses an already-initialized environment from a previous invocation — much faster, since the container/runtime is already running.

Mitigation strategies: keep function package size small, avoid heavy imports at the top level when possible, use Provisioned Concurrency (AWS keeps N environments pre-warmed) for latency-sensitive endpoints, or bump memory (which also gives more CPU, indirectly speeding init).`,
  },
  {
    id: 4,
    question: 'How does Lambda pricing work?',
    answer: `Two components:
1. Number of requests — priced per million invocations.
2. Duration — priced per GB-second (memory allocated × execution time in ms, rounded up).

Free tier: 1 million requests + 400,000 GB-seconds of compute per month, forever (not just 12 months).

Practical implication: memory allocation affects BOTH speed (more memory = more CPU) and cost per ms — so bumping memory sometimes reduces total cost if the function finishes proportionally faster. I always benchmark a couple of memory settings before locking one in.`,
  },
  {
    id: 5,
    question: 'What is the Lambda execution timeout limit?',
    answer: `Maximum execution time per invocation is 15 minutes (900 seconds) — after that, Lambda forcibly terminates the function.

This is a hard architectural signal: if a task genuinely needs longer than 15 minutes, Lambda isn't the right tool — options are breaking the job into smaller chunks (e.g., via Step Functions), using SQS to queue and process in batches, or moving that specific workload to EC2/ECS/Fargate instead.

I ran into this while thinking through a bulk video-processing idea — anything that could exceed a few minutes per file, I'd rather hand off to a longer-running worker (ECS task or EC2) than force it into a Lambda.`,
  },
  {
    id: 6,
    question: 'What are Lambda Layers?',
    answer: `A Layer is a way to package shared code/dependencies (like a common npm library, or shared utility functions) separately from your function code, so multiple Lambda functions can reuse the same layer instead of bundling the dependency into every function's deployment package.

Benefits: smaller individual function packages, faster deploys, shared code stays consistent across functions (update the layer once, all functions using it pick it up on next deploy/reference).

Good use case: a shared "db connection" or "logger" utility used across 5+ small Lambda functions in a serverless app — put it in a layer instead of duplicating it in every function's node_modules.`,
  },
  {
    id: 7,
    question: 'How do you handle environment-specific config (like DB credentials) in Lambda?',
    answer: `Environment Variables — set directly on the function config, good for non-sensitive config (API URLs, feature flags).

AWS Secrets Manager / SSM Parameter Store — for sensitive values (DB passwords, API keys), fetched at runtime instead of stored as plain env vars.

const secret = await ssm.getParameter({ Name: '/myapp/db-password', WithDecryption: true }).promise();

Lesson I follow: never hardcode credentials in the function code, and prefer Secrets Manager/Parameter Store over plain environment variables for anything sensitive — env vars are visible to anyone with console/API access to that function's config.`,
  },
  {
    id: 8,
    question: 'What is the difference between synchronous and asynchronous Lambda invocation?',
    answer: `Synchronous — caller waits for the function to finish and gets the response directly (e.g., API Gateway → Lambda). If it fails, the error is returned immediately to the caller, and retry logic (if any) is the caller's responsibility.

Asynchronous — caller (e.g., S3, SNS) hands off the event and moves on, doesn't wait for a response. Lambda automatically retries on failure (up to 2 retries by default), and you can configure a Dead Letter Queue (DLQ) or on-failure destination for events that still fail after retries.

Practical difference: for an API endpoint, I need sync (user is waiting for a response). For a background job like "resize this uploaded image", async fits better since the caller (S3 event) doesn't need to wait.`,
  },
  {
    id: 9,
    question: 'What is Lambda concurrency and what is a "throttle"?',
    answer: `Concurrency = number of instances of your function running at the same time. By default, an AWS account has a regional concurrency limit (commonly 1000, can be increased via support request) shared across all functions in that region.

If incoming requests exceed the available concurrency, Lambda throttles (rejects) the extra invocations with a 429-style error.

Reserved Concurrency — guarantees (and caps) a specific number of concurrent executions for one function, so it can't be starved by other functions, but also can't exceed that number, protecting downstream systems (like a DB) from being overwhelmed by a traffic spike.

I'd set reserved concurrency on a function that writes to a rate-limited third-party API, so a traffic spike doesn't get me blocked by that API's rate limits.`,
  },
  {
    id: 10,
    question: 'How would you debug a Lambda function that\'s failing in production?',
    answer: `Main tool: CloudWatch Logs — every Lambda invocation's console.log/error output goes to a CloudWatch Log Group automatically, that's the first place to check.

console.log('Processing event:', JSON.stringify(event));

Also check: CloudWatch Metrics (Errors, Duration, Throttles graphs) to spot patterns, X-Ray tracing for tracking a request across multiple services (API Gateway → Lambda → DynamoDB, etc.) if it's a multi-step flow, and the function's memory/timeout config — a surprisingly common "bug" is just the function timing out or running out of memory under real load, not an actual code error.

I always add structured logging with a request/correlation ID at the start of a function — makes filtering CloudWatch logs for one specific failing request far easier than plain unstructured console.log.`,
  },
];

/* ------------------------------------------------------------------ */
/* EC2 QUESTIONS                                                       */
/* ------------------------------------------------------------------ */
const EC2_QUESTIONS = [
  {
    id: 1,
    question: 'What is EC2 and what is an "instance"?',
    answer: `EC2 (Elastic Compute Cloud) is AWS's virtual server service — an "instance" is one virtual machine you provision, with a chosen OS, CPU/RAM (instance type), and storage.

Unlike Lambda, EC2 gives you full control of the machine — install anything, run any process continuously, SSH in directly — but you're responsible for managing it (patching, scaling, security).

I'd reach for EC2 when a workload needs to run continuously, needs specific system-level dependencies, or runs long enough that Lambda's timeout makes it impractical.`,
  },
  {
    id: 2,
    question: 'What are EC2 instance types, and how do you choose one?',
    answer: `Instance types are grouped by what they're optimized for:

General Purpose (t3, m5) — balanced CPU/memory, good default for web servers/small apps.
Compute Optimized (c5) — high CPU, low memory ratio — good for CPU-heavy processing.
Memory Optimized (r5) — high memory ratio — good for in-memory caches, large databases.
Storage Optimized (i3) — high-speed local storage — good for data warehousing.

t3.micro, t3.small, m5.large, c5.xlarge ...

For a typical Node.js backend + MySQL combo I've worked with, a general-purpose t3/t3a instance is usually the starting point — only move to compute/memory-optimized once actual load testing shows a specific bottleneck.`,
  },
  {
    id: 3,
    question: 'Difference between On-Demand, Reserved, and Spot instances?',
    answer: `On-Demand — pay per second/hour, no commitment, most expensive per-hour, good for unpredictable or short-term workloads.

Reserved Instances — commit to 1 or 3 years, significant discount (up to ~70%) in exchange for the commitment, good for predictable, always-on workloads (like a production DB server).

Spot Instances — bid on AWS's spare capacity at a steep discount (up to ~90% off), but AWS can reclaim the instance with only a short warning if it needs the capacity back — good for fault-tolerant, interruptible workloads (batch jobs, CI runners) but risky for anything stateful/critical.

For a production app server that must always be up, I'd use Reserved. For a background batch/video-processing job that can retry, Spot makes sense for the cost savings.`,
  },
  {
    id: 4,
    question: 'What is a Security Group in EC2?',
    answer: `A Security Group is a virtual firewall attached to an EC2 instance, controlling inbound and outbound traffic at the instance level — rule-based, e.g., "allow inbound TCP 22 (SSH) only from my IP" or "allow inbound TCP 443 from anywhere."

Key facts: stateful (if inbound traffic is allowed, the matching outbound response is automatically allowed, no need for a separate rule), default is deny-all inbound / allow-all outbound, and you can attach multiple security groups to one instance.

Common mistake I've seen: leaving SSH (port 22) open to 0.0.0.0/0 (anywhere) — should always be restricted to a specific IP or a bastion host/VPN.`,
  },
  {
    id: 5,
    question: 'What is the difference between a Security Group and a Network ACL?',
    answer: `Security Group — operates at the instance level, stateful (return traffic auto-allowed), only supports "allow" rules.

Network ACL (NACL) — operates at the subnet level, stateless (inbound and outbound rules must both be explicitly defined, even for responses), supports both "allow" and "deny" rules, and rules are evaluated in numbered order.

Practical difference: I use Security Groups for almost all day-to-day access control (they're simpler and cover 95% of cases); NACLs come into play only for stricter subnet-wide policies, like explicitly blocking a known-bad IP range at the subnet level regardless of which instance's SG would otherwise allow it.`,
  },
  {
    id: 6,
    question: 'How do you connect to an EC2 instance, and what is a key pair?',
    answer: `A key pair is a public/private key combo — AWS stores the public key on the instance at launch, you keep the private key (.pem file) locally, and use it to SSH in without a password.

ssh -i my-key.pem ubuntu@<instance-public-ip>

Best practice I follow: never share the .pem file, chmod 400 it locally so it's not world-readable (SSH refuses to use an overly-permissive key file), and prefer connecting through a bastion host or AWS Systems Manager Session Manager for production instances instead of exposing SSH (port 22) directly to the internet.`,
  },
  {
    id: 7,
    question: 'What is an Elastic IP, and why would you use one?',
    answer: `An Elastic IP is a static public IPv4 address you allocate to your AWS account and attach to an EC2 instance — unlike the default public IP, it doesn't change if the instance is stopped/restarted.

Useful when something external depends on a fixed IP — like a DNS A record pointing to your server, or a third-party API/webhook whitelisting your server's IP.

Note: AWS charges for an Elastic IP that's allocated but NOT attached to a running instance — a common surprise on the bill if you allocate one and forget to release it.`,
  },
  {
    id: 8,
    question: 'What is Auto Scaling and a Load Balancer, and how do they work together?',
    answer: `Load Balancer (ELB/ALB) — sits in front of multiple EC2 instances, distributes incoming traffic across them, and does health checks to stop routing to unhealthy instances.

Auto Scaling Group (ASG) — automatically adds or removes EC2 instances based on demand (e.g., scale out when average CPU > 70%, scale in when it drops), keeping a minimum/maximum instance count.

Together: the Load Balancer is the stable entry point (one DNS name), and the ASG behind it grows/shrinks the actual instance count based on real traffic — so a traffic spike triggers new instances to launch, register with the Load Balancer automatically, and start taking traffic.

This is the standard pattern I'd reach for once a single-server setup starts hitting real load, instead of manually resizing one big instance.`,
  },
  {
    id: 9,
    question: 'EBS vs Instance Store — what\'s the difference?',
    answer: `EBS (Elastic Block Store) — persistent, network-attached block storage — survives instance stop/termination (unless explicitly set to delete on termination), can be detached and re-attached to another instance, can be resized, and snapshotted to S3 for backups.

Instance Store — physically attached local disk on the host machine — much faster, but ephemeral: data is LOST if the instance stops or terminates (not just reboots — stop/terminate).

Rule I follow: EBS for anything that needs to survive a restart (OS disk, DB data), Instance Store only for pure scratch/temp data (like a local cache) where losing it on stop is acceptable — never for anything I can't afford to lose.`,
  },
  {
    id: 10,
    question: 'How would you set up zero-downtime deployment on EC2?',
    answer: `A few common approaches, roughly in increasing complexity:

1. Behind a Load Balancer with 2+ instances — deploy to one instance at a time (rolling deployment), letting the LB keep routing to the still-healthy instance(s) while the other updates.

2. Blue-Green deployment — spin up a completely new set of instances with the new code, health-check them, then switch the Load Balancer/DNS over to the new set, and only terminate the old set after confirming the new one's healthy — safest, easiest instant rollback.

3. Process-manager-level (single instance, simpler apps) — use something like PM2's reload (pm2 reload app) which restarts worker processes one at a time behind Node's cluster mode, so there's no full downtime window, though it's less robust than a true multi-instance setup.

For smaller apps I've deployed, PM2 reload on a single instance has been enough; blue-green/rolling via a Load Balancer is what I'd reach for once uptime during deploys actually matters for real users.`,
  },
];

/* ------------------------------------------------------------------ */
/* OTHER IMPORTANT SERVICES QUESTIONS                                  */
/* ------------------------------------------------------------------ */
const OTHER_QUESTIONS = [
  {
    id: 1,
    question: 'What is IAM, and what is the difference between a User, Group, Role, and Policy?',
    answer: `IAM (Identity and Access Management) controls WHO can access WHAT in your AWS account.

User — a specific identity (person or app) with its own credentials.
Group — a collection of Users, used to apply the same permissions to many users at once.
Role — an identity that can be ASSUMED temporarily (by a user, another AWS service, or an external identity) instead of having permanent credentials — e.g., an EC2 instance assumes a Role to access S3, instead of hardcoding access keys on the instance.
Policy — a JSON document defining actual permissions (allow/deny on specific actions/resources), attached to Users/Groups/Roles.

Best practice I follow: never hardcode long-term access keys in app code — attach an IAM Role to the EC2 instance/Lambda function instead, so credentials are temporary and auto-rotated by AWS.`,
  },
  {
    id: 2,
    question: 'What is the Principle of Least Privilege in AWS?',
    answer: `Grant an identity (user/role) ONLY the specific permissions it actually needs to do its job — nothing broader "just in case."

Example: instead of attaching AmazonS3FullAccess to a Lambda function that only needs to read one specific bucket, write a scoped policy allowing s3:GetObject on just that bucket/prefix.

{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}

Why it matters: if credentials/a role are ever compromised, the damage is limited to exactly what that narrow policy allows — not the entire AWS account. I try to start every new Lambda/EC2 role scoped as tightly as possible and only widen it if something genuinely needs more access.`,
  },
  {
    id: 3,
    question: 'What is a VPC?',
    answer: `A VPC (Virtual Private Cloud) is your own isolated, private network within AWS — you define the IP range, subnets, routing, and gateways, and your resources (EC2, RDS, etc.) live inside it.

Public Subnet — has a route to an Internet Gateway, resources here can be reached from/reach the internet directly (e.g., a web server).
Private Subnet — no direct internet route, used for things that shouldn't be publicly reachable (e.g., a database) — internet access, if needed, goes through a NAT Gateway.

Common real-world setup: web/app servers in a public subnet, database (RDS) in a private subnet only reachable from the app servers' security group — so the DB is never directly exposed to the internet.`,
  },
  {
    id: 4,
    question: 'What is Amazon RDS, and how is it different from running MySQL on EC2 yourself?',
    answer: `RDS (Relational Database Service) is a managed relational database — AWS handles provisioning, patching, automated backups, and failover, for engines like MySQL, PostgreSQL, MariaDB, SQL Server.

Self-managed MySQL on EC2 — you handle everything yourself: OS patching, DB software updates, backup scripts, replication setup, failover logic.

RDS trade-off: less manual ops work and built-in Multi-AZ failover, but less low-level control (e.g., no direct SSH into the DB host, limited plugin/config access) and generally higher cost than a comparable self-managed EC2 instance.

For the school management app and similar projects, I'd default to RDS for production — the operational overhead of self-managing backups/patching/failover isn't worth it unless there's a specific reason to need that level of control.`,
  },
  {
    id: 5,
    question: 'What is DynamoDB and when would you choose it over RDS?',
    answer: `DynamoDB is AWS's fully managed NoSQL key-value/document database — serverless, scales automatically, single-digit millisecond latency at virtually any scale, pay based on read/write capacity (or on-demand pricing).

Choose DynamoDB when: access patterns are simple and known upfront (lookup by key), you need massive scale with predictable low latency, and the data doesn't need complex JOINs/ad-hoc queries.

Choose RDS when: data is relational, you need complex queries/JOINs/transactions across multiple tables, or the team is more comfortable with SQL.

For something like a school management app with lots of relational data (teachers, classes, attendance, relationships between them), RDS/MySQL fits better than DynamoDB — DynamoDB would shine more for something like a high-scale session store or a simple event log.`,
  },
  {
    id: 6,
    question: 'What is CloudWatch and what is it used for?',
    answer: `CloudWatch is AWS's monitoring and observability service — collects Logs, Metrics, and lets you set Alarms based on them.

Logs — application/service log output (e.g., every Lambda invocation's console output goes here automatically).
Metrics — numeric data over time (CPU utilization, request count, error count) — either built-in per service or custom metrics you push yourself.
Alarms — trigger an action (like an SNS notification, or an Auto Scaling event) when a metric crosses a threshold, e.g., "alert me if EC2 CPU > 80% for 5 minutes."

I'd set up a CloudWatch Alarm on error rate/latency for any production API, so I get notified before users start reporting problems, not after.`,
  },
  {
    id: 7,
    question: 'What is the difference between SQS and SNS?',
    answer: `SQS (Simple Queue Service) — a message QUEUE, point-to-point: a message is delivered to and consumed by ONE consumer, then removed from the queue. Good for decoupling a producer from a worker that processes tasks at its own pace.

SNS (Simple Notification Service) — a PUB/SUB topic: a message published to a topic is delivered to ALL subscribers (could be multiple SQS queues, Lambda functions, emails, etc.) at once, fan-out style.

Common combined pattern: SNS topic fans out an event to multiple SQS queues, each queue feeding a different independent worker/service — e.g., a "new order placed" event goes to one queue for sending a confirmation email, and a separate queue for updating inventory, without those two systems needing to know about each other.`,
  },
  {
    id: 8,
    question: 'What is API Gateway, and why put it in front of Lambda instead of exposing Lambda directly?',
    answer: `API Gateway is a managed service for creating, publishing, and managing APIs — routes HTTP requests to backends (commonly Lambda), and handles things Lambda itself doesn't: request/response transformation, authentication (API keys, Cognito, custom authorizers), rate limiting/throttling, request validation, and CORS configuration.

While Lambda does have a simpler built-in "Function URL" option for direct HTTP access, API Gateway is the go-to when you need proper API-level concerns — versioning, usage plans/API keys per client, custom domain names, or combining multiple Lambda functions under one coherent REST/HTTP API.

For a small internal webhook receiver, a Lambda Function URL alone might be enough; for a public-facing API with multiple endpoints and auth requirements, API Gateway in front is the more standard, maintainable setup.`,
  },
  {
    id: 9,
    question: 'What is CloudFront and how does it work with S3?',
    answer: `CloudFront is AWS's CDN (Content Delivery Network) — caches content at edge locations around the world, so users get content served from a nearby edge server instead of the origin, reducing latency.

Common pairing with S3: S3 bucket holds the actual files (images, videos, static site assets), CloudFront sits in front of it as the public-facing distribution — caching responses at edge locations and optionally keeping the S3 bucket itself completely private (using an Origin Access Control so only CloudFront can read from it directly).

Benefits beyond speed: HTTPS termination at the edge, DDoS protection (via AWS Shield integration), and reduced direct load/cost on the S3 bucket since repeat requests get served from cache instead of hitting S3 every time.`,
  },
  {
    id: 10,
    question: 'What is an Availability Zone vs a Region in AWS?',
    answer: `Region — a geographic area (e.g., ap-south-1 for Mumbai, us-east-1 for N. Virginia) containing multiple, isolated data centers.

Availability Zone (AZ) — one or more discrete data centers WITHIN a region, each with independent power/cooling/networking, but connected to other AZs in the same region via low-latency links.

Why it matters: deploying across multiple AZs within a region (e.g., Multi-AZ RDS, or EC2 instances in an Auto Scaling Group spread across 2+ AZs) protects against a single data-center-level failure, while staying in one Region keeps latency low for a given user base. Going multi-Region is a separate, bigger decision — usually for disaster recovery or serving genuinely global users with low latency everywhere.`,
  },
];

const TABS = [
  { key: 's3', label: 'S3 Bucket', data: S3_QUESTIONS },
  { key: 'lambda', label: 'Lambda', data: LAMBDA_QUESTIONS },
  { key: 'ec2', label: 'EC2', data: EC2_QUESTIONS },
  { key: 'other', label: 'Other Imp Services', data: OTHER_QUESTIONS },
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
   DatabaseQA. Swap for scss module classes if you add shared tab styles. */
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

export default function AwsQA() {
  const [activeTab, setActiveTab] = useState('s3');
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