'use client';
import Link from 'next/link';
import styles from './page.module.scss';
import { 
  FiServer, FiCloud, FiDatabase, FiUser,
  FiHelpCircle
} from 'react-icons/fi';
import { 
  SiNodedotjs, SiReact, SiJavascript, 
  SiTypescript, SiDocker 
} from 'react-icons/si';

const TOPICS = [
    {
    title: 'Old Data APP',
    badge: 'Soft skills',
    count: '20+',
    icon: <SiJavascript />,
    accent: '#378ADD',
    iconBg: '#E6F1FB',
    iconColor: '#185FA5',
    badgeBg: '#E6F1FB',
    badgeColor: '#185FA5',
    slug: '',
  },
  {
    title: 'Personal / HR',
    badge: 'Soft skills',
    count: '20+',
    icon: <FiUser />,
    accent: '#D4537E',
    iconBg: '#FBEAF0',
    iconColor: '#72243E',
    badgeBg: '#FBEAF0',
    badgeColor: '#72243E',
    slug: 'personal',
  },
  {
    title: 'Node.js',
    badge: 'Backend',
    count: '40+',
    icon: <SiNodedotjs />,
    accent: '#5DCAA5',
    iconBg: '#E1F5EE',
    iconColor: '#0F6E56',
    badgeBg: '#E1F5EE',
    badgeColor: '#0F6E56',
    slug: 'nodejs',
  },
  {
    title: 'React.js',
    badge: 'Frontend',
    count: '50+',
    icon: <SiReact />,
    accent: '#378ADD',
    iconBg: '#E6F1FB',
    iconColor: '#185FA5',
    badgeBg: '#E6F1FB',
    badgeColor: '#185FA5',
    slug: 'reactjs',
  },
  {
    title: 'Database',
    badge: 'SQL / NoSQL',
    count: '35+',
    icon: <FiDatabase />,
    accent: '#EF9F27',
    iconBg: '#FAEEDA',
    iconColor: '#854F0B',
    badgeBg: '#FAEEDA',
    badgeColor: '#854F0B',
    slug: 'database',
  },
  {
    title: 'AWS',
    badge: 'Cloud',
    count: '30+',
    icon: <FiCloud />,
    accent: '#D85A30',
    iconBg: '#FAECE7',
    iconColor: '#993C1D',
    badgeBg: '#FAECE7',
    badgeColor: '#993C1D',
    slug: 'aws',
  },
  {
    title: 'JavaScript',
    badge: 'Core JS',
    count: '60+',
    icon: <SiJavascript />,
    accent: '#FAC775',
    iconBg: '#FAEEDA',
    iconColor: '#633806',
    badgeBg: '#FAEEDA',
    badgeColor: '#633806',
    slug: 'javascript',
  },
  {
    title: 'TypeScript',
    badge: 'Typed JS',
    count: '25+',
    icon: <SiTypescript />,
    accent: '#7F77DD',
    iconBg: '#EEEDFE',
    iconColor: '#3C3489',
    badgeBg: '#EEEDFE',
    badgeColor: '#3C3489',
    slug: 'typescript',
  },  
  {
    title: 'Docker & CI/CD',
    badge: 'DevOps',
    count: '28+',
    icon: <SiDocker />,
    accent: '#888780',
    iconBg: '#F1EFE8',
    iconColor: '#444441',
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
    slug: 'docker-cicd',
  },
];

export default function Home() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Interview preparation</p>
        <h1 className={styles.title}>Most asked questions</h1>
        <p className={styles.subtitle}>
          Topic-wise questions — padho, samjho, confident raho.
        </p>
      </div>

      <div className={styles.grid}>
        {TOPICS.map((t) => (
          <Link
            key={t.slug}
            href={`/interviewprep/${t.slug}`}
            className={styles.card}
          >
            <div
              className={styles.accent}
              style={{ background: t.accent }}
            />
            <div
              className={styles.iconBox}
              style={{ background: t.iconBg, color: t.iconColor }}
            >
              {t.icon}
            </div>
            <p className={styles.cardTitle}>{t.title}</p>
            <span
              className={styles.badge}
              style={{ background: t.badgeBg, color: t.badgeColor }}
            >
              {t.badge}
            </span>
            <div className={styles.meta}>
              <FiHelpCircle size={12} />
              {t.count} questions
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}