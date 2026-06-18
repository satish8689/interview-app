'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from './personal.module.scss';

const QUESTIONS = [
  {
    id: 1,
    question: 'Tell me something about yourself.',
    answer: `I am Satish Hargod, a Full Stack Developer with over 8 years of experience in IT companies.

I have strong expertise in Node.js for backend development and React.js for frontend, and have also worked with Next.js in several projects. At the start of my career, I worked with PHP for more than 2 years before transitioning to JavaScript technologies.

I have experience with both monolithic and microservices architectures, and have worked with AWS services including Lambda functions, S3 buckets, and basic EC2 configuration including launching instances, IP setup, and load balancing.

For databases, I have worked with both SQL and NoSQL — MySQL and PostgreSQL on the SQL side, and MongoDB and Redis for NoSQL.

Currently, I am working on the Reading Cinemas project, an online cinema booking platform where I've built scalable backend APIs for seat selection, food ordering, membership benefits, gift cards, and real-time notifications — while ensuring performance under high user traffic.

Some key projects from my career:

• Real-time Chat Application — WebSocket for real-time communication, FCN for notifications.
• E-commerce Platform — APIs for frontend and admin panel covering users, products, orders, and tracking with AWS S3 for image storage.
• Blockchain Projects — Subgraph events, Ethereum and Binance networks, Infura and Pinata integrations.
• Order Management System — Multi-platform orders across Amazon, Walmart, and eBay with CSV import/export and real-time updates.

That's a brief about me. Thank you.`,
  },
  {
    id: 2,
    question: 'Tell me more about Reading Cinemas.',
    answer: `Reading Cinemas is an online movie booking platform where users can book tickets, select seats, order food, and access features like membership benefits and gift cards.

My primary role was Full Stack Developer — responsible for designing scalable APIs in Node.js, building UI components with React.js, working with AWS Lambda, and integrating third-party services.

Key responsibilities:

• Seat Selection & Food Ordering — Integrated Vista API for real-time seat availability and food items. Implemented seat locking to prevent double booking and ensure data consistency.

• Payment Integration — Integrated Google Pay, Credit Cards, and reward points. Handled secure transactions and failure recovery scenarios.

• Gift Cards & Booking Features — Implemented gift cards for birthdays and special occasions. Developed party booking feature for group bookings.

• Multi-location Support — Designed the system to handle multiple cinema locations and show timings efficiently.

• Notifications — Implemented real-time notifications for booking confirmation, reminders, and promotional offers.

Overall, this project gave me strong hands-on experience in high-traffic systems, third-party integrations, and building reliable backend architectures. Thank you.`,
  },
  {
    id: 3,
    question: 'What are your roles and responsibilities?',
    answer: `Currently I work as a Full Stack Developer with hands-on experience in React.js, Node.js, and AWS Lambda.

Beyond development, I take ownership of task planning and team coordination. I work closely with the Manager and Team Lead to understand requirements and break them down into smaller, actionable tasks.

I proactively assign tasks to team members based on their strengths and guide them whenever needed to ensure smooth execution.

My responsibilities include:

• Code Quality — Conducting detailed code reviews and ensuring best practices are followed across the team.

• Testing — Performing unit testing to validate functionality before merging code into sub-branches.

• Version Control — Managing branches and workflows using GitHub and Bitbucket.

• Project Tracking — Monitoring progress through JIRA to ensure timely delivery.

• Delivery Coordination — Working with the Team Lead and QA team to ensure proper testing, feedback handling, and smooth feature rollout.

Overall, I contribute not just as a developer but as a team player who ensures quality, timely delivery, and efficient collaboration.`,
  },
  {
    id: 4,
    question: 'Gap Reasons?',
    answer: `At that time there was a medical emergency in my family, due to which I had to relocate from Ahmedabad to Indore.
    After that, I got a good opportunity with a company here in Indore and joined them.`,
  },
  {
    id: 5,
    question: 'Why leave your current company?',
    answer: `Sir, my current company's main office is in Chennai. They asked me to relocate to Chennai, but I do not want to relocate. So I decided to look for a good opportunity in Indore itself where I can work long term.`,
  },
  {
    id: 6,
    question: 'Current CTC and expecting CTC',
    answer: `My current CTC is 17 LPA. I am expecting around 18–20 LPA, but I am open to discussion based on the role, responsibilities, and the company's budget. My main priority is to get the right job opportunity and grow with the organization.`,
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

export default function PersonalQA() {
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
          <h1 className={styles.headerTitle}>Personal / HR</h1>
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