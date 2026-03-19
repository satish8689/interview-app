import React, { useEffect, useState } from "react";
import styles from "./InterviewPrep.module.scss";

const categories = [
  "all",
  "personal",
  "react",
  "node",
  "mongodb",
  "sql",
  "others"
];


const InterviewPrep = () => {
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    getInterviewQA();
  }, []);

  async function getInterviewQA() {
    let apiresult = await fetch("/api/interview");
    let { data } = await apiresult.json();
    if (data?.length > 0) {
      setQuestions(data);
    }
  }

  const filteredData =
    activeTab === "all"
      ? questions
      : questions.filter((item) =>
          item.type?.toLowerCase().includes(activeTab)
        );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Interview Preparation</h2>

      <div className={styles.list}>
        {filteredData.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className={`${styles.card} ${isOpen ? styles.active : ""} ${item.answer?"":styles.nodata}`}
            >
              <div
                className={styles.question}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <span className={styles.icon}>
                  {isOpen ? "−" : "+"}
                </span>
              </div>

              <div className={styles.answerWrapper}>
                <div
                  className={styles.answer}
                  dangerouslySetInnerHTML={{
                    __html: item.answer,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Menu */}
      <div className={styles.bottomMenu}>
        {categories.map((cat, i) => (
          <button
            key={i}
            className={`${styles.tab} ${
              activeTab === cat ? styles.activeTab : ""
            }`}
            onClick={() => {
              setActiveTab(cat);
              setOpenIndex(null);
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InterviewPrep;