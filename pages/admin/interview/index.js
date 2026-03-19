'use client';

import Link from 'next/link';
import styles from './interview.module.scss';
import { useState, useEffect } from 'react';
import { FaEdit, FaPlus, FaTrash, FaSearch } from 'react-icons/fa';

const types = ["all", "react", "node", "mongodb", "sql", "personal", "others"];

export default function InterviewAdmin() {
  const [questions, setQuestions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: '',
    question: '',
    type: '',
    answer: '',
  });

  /* ================= FETCH ================= */

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/interview');
      const data = await res.json();
      const list = data?.data?.reverse() || [];
      setQuestions(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  /* ================= FILTER + SEARCH ================= */

  useEffect(() => {
    let temp = [...questions];

    if (activeType !== "all") {
      temp = temp.filter(q => q.type?.toLowerCase() === activeType);
    }

    if (search.trim()) {
      temp = temp.filter(q =>
        q.question?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(temp);
  }, [search, activeType, questions]);

  /* ================= MODAL ================= */

  const openAddModal = () => {
    setForm({ id: '', question: '', type: '', answer: '' });
    setEditItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setForm({
      id: item.id,
      question: item.question,
      type: item.type,
      answer: item.answer,
    });
    setEditItem(item);
    setShowModal(true);
  };

  /* ================= HANDLER ================= */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SAVE ================= */

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const method = editItem ? 'PUT' : 'POST';

    const res = await fetch('/api/interview', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    console.log("API RESPONSE:", data);

    if (!res.ok) {
      alert(data.error || "Save failed");
      return;
    }

    // ✅ 🔥 YAHAN ADD KARNA HAI (IMPORTANT)
    if (editItem) {
      setQuestions(prev =>
        prev.map(q => q.id === form.id ? form : q)
      );
    } else {
      setQuestions(prev => [
        { ...form, id: data?.item?.id || Date.now().toString() },
        ...prev
      ]);
    }

    setShowModal(false);

  } catch (err) {
    console.error(err);
    alert('Error saving data');
  } finally {
    setLoading(false);
  }
};

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;

    try {
      await fetch('/api/interview', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      fetchQuestions();
    } catch {
      alert('Delete failed');
    }
  };

  return (
    <div className={styles.container}>

      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.left}>
          <Link href="/admin" className={styles.backBtn}>⬅</Link>
          <h1>Interview Manager</h1>
        </div>

        <button className={styles.addBtn} onClick={openAddModal}>
          <FaPlus /> Add
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className={styles.topBar}>
        <div className={styles.searchBox}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterTabs}>
          {types.map((t, i) => (
            <button
              key={t + i}
              className={activeType === t ? styles.activeTab : ""}
              onClick={() => setActiveType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className={styles.cardList}>
        {filtered.length === 0 && (
          <p className={styles.empty}>No results found</p>
        )}

        {filtered.map((item, index) => (
          <div
            className={styles.card}
            key={item.id || item._id || index}
          >
            <div>
              <h3>{item.question}</h3>
              <span className={styles.type}>{item.type}</span>
            </div>

            <div className={styles.actions}>
              <button onClick={() => openEditModal(item)}>
                <FaEdit />
              </button>
              <button onClick={() => handleDelete(item.id)}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editItem ? 'Edit Question' : 'Add Question'}</h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Question</label>
                <input
                  name="question"
                  value={form.question}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="react">React</option>
                  <option value="node">Node</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="mysql">MySQL</option>
                  <option value="personal">Personal</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Answer</label>
                <textarea
                  name="answer"
                  value={form.answer}
                  onChange={handleChange}
                  rows="6"
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>

                <button type="submit" className={styles.saveBtn}>
                  {loading ? 'Saving...' : editItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}