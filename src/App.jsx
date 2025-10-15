// src/App.jsx
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { useEffect, useState } from 'react';

const client = generateClient();

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => <NotesApp user={user} signOut={signOut} />}
    </Authenticator>
  );
}

function NotesApp({ user, signOut }) {
  const [notes, setNotes] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  async function withImageUrls(items) {
    return Promise.all(
      items.map(async (n) => {
        if (n.image) {
          try {
            const url = await getUrl({ key: n.image, options: { expiresIn: 60 } });
            return { ...n, _imgUrl: url.url.toString() };
          } catch {
            return n;
          }
        }
        return n;
      })
    );
  }

  async function refresh() {
    const { data } = await client.models.Note.list();
    setNotes(await withImageUrls(data));
  }

  async function createNote() {
    if (!name.trim()) return;
    let key;
    if (file) {
      key = `public/${crypto.randomUUID()}-${file.name}`;
      await uploadData({ key, data: file, options: { contentType: file.type } }).result;
    }
    await client.models.Note.create({ name, description, image: key });
    setName('');
    setDescription('');
    setFile(null);
    await refresh();
  }

  function startEdit(n) {
    setEditingId(n.id);
    setEditName(n.name ?? '');
    setEditDescription(n.description ?? '');
  }

  async function saveEdit() {
    if (!editingId) return;
    await client.models.Note.update({
      id: editingId,
      name: editName,
      description: editDescription,
    });
    setEditingId(null);
    await refresh();
  }

  async function deleteNote(n) {
    await client.models.Note.delete({ id: n.id });
    if (n.image) {
      try { await remove({ key: n.image }); } catch {}
    }
    await refresh();
  }

  useEffect(() => { refresh(); }, []);

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Notes</h1>
      <p>Signed in as <strong>{user?.signInDetails?.loginId || user?.username}</strong></p>

      {/* Create */}
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Note name"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={createNote}>Create</button>
        <button onClick={signOut}>Sign out</button>
      </div>

      <hr style={{ margin: '16px 0' }} />

      {/* List / Edit / Delete */}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
        {notes.map((n) => (
          <li key={n.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            {editingId === n.id ? (
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto' }}>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name"
                />
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEdit}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <strong>{n.name}</strong>
                    {n.description ? <div style={{ color: '#555' }}>{n.description}</div> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(n)}>Edit</button>
                    <button onClick={() => deleteNote(n)}>Delete</button>
                  </div>
                </div>
                {n._imgUrl ? (
                  <img
                    src={n._imgUrl}
                    alt={n.name}
                    style={{ marginTop: 8, maxWidth: 320, borderRadius: 6 }}
                  />
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}