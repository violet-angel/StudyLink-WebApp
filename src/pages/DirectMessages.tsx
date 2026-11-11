
import {
  useEffect,
  useState,
  type FormEvent
} from 'react';

import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser } from '../lib/session';

import '../styles/student-dashboard.css';

type Message = {
  id: number;
  senderId: number;
  recipientId: number;
  body: string;
  createdAt: string;
};

type Student = {
  id: number;
  name: string;
};

export default function DirectMessages() {
  const { studentId } = useParams<{ studentId: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const me = getStoredUser();

  useEffect(() => {
    if (!studentId) return;

    let active = true;

    const reload = async () => {
      try {
        const response = await apiFetch(
          `/api/student/direct-messages/${studentId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Cannot load conversation.'
          );
        }

        if (active) {
          setStudent(data.student);
          setMessages(data.messages || []);
          setError('');
        }

      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Network error.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    setMessages([]);
    setStudent(null);

    void reload();

    const timer = window.setInterval(
      () => void reload(),
      10000
    );

    return () => {
      active = false;
      window.clearInterval(timer);
    };

  }, [studentId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!studentId || !body.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await apiFetch(
        `/api/student/direct-messages/${studentId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: body.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not send message.'
        );
      }

      setMessages(previous =>
        previous.some(m => m.id === data.message.id)
          ? previous
          : [...previous, data.message]
      );

      setBody('');

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not send message.'
      );

    } finally {
      setSending(false);
    }
  };

  return (
    <section className="workspace-page student-dashboard">
      <div className="container student-dashboard-stack">

        <header className="sd-hero">
          <div>
            <p className="sd-eyebrow">
              Student Network
            </p>

            <h1>
              {student
                ? `Conversation with ${student.name}`
                : 'Private Messages'}
            </h1>

            <p>
              Messages are private between you and this
              classmate. New messages are checked every
              10 seconds.
            </p>
          </div>

          <Link
            className="button button-secondary"
            to="/discover-classmates"
          >
            Back to Classmates
          </Link>
        </header>

        {error && (
          <p className="sd-error" role="alert">
            {error}
          </p>
        )}

        <div
          className="sd-panel"
          style={{
            maxHeight: 480,
            minHeight: 250,
            overflowY: 'auto'
          }}
          aria-live="polite"
        >
          {loading ? (
            <p>Loading conversation...</p>
          ) : messages.length === 0 ? (
            <p>No messages yet. Start the conversation.</p>
          ) : (
            messages.map(message => {
              const mine =
                Number(message.senderId) === Number(me?.id);

              return (
                <article
                  key={message.id}
                  className="sd-list-item"
                  style={{
                    justifyContent: mine
                      ? 'flex-end'
                      : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: 12,
                      borderRadius: 12,
                      background: mine
                        ? '#dbeafe'
                        : '#f1f5f9'
                    }}
                  >
                    <strong>
                      {mine ? 'You' : student?.name || 'Classmate'}
                    </strong>

                    <p
                      style={{
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {message.body}
                    </p>

                    <small>
                      {new Date(
                        message.createdAt
                      ).toLocaleString()}
                    </small>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <form
          onSubmit={submit}
          className="sd-panel"
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <label
            htmlFor="direct-message-body"
            style={{ width: '100%' }}
          >
            Your message
          </label>

          <textarea
            id="direct-message-body"
            rows={3}
            maxLength={2000}
            required
            disabled={!student || sending || !!error}
            value={body}
            onChange={event =>
              setBody(event.target.value)
            }
            placeholder="Write a private message..."
            style={{
              flex: '1 1 260px',
              padding: 12,
              border: '1px solid #cbd5e1',
              borderRadius: 8
            }}
          />

          <button
            type="submit"
            className="button button-primary"
            disabled={
              sending ||
              !student ||
              !!error ||
              !body.trim()
            }
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
}
