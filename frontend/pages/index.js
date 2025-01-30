import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      
      setResult({
        text: data.text,
        timestamps: data.timestamps
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎙️ Transcrição de Áudio</h1>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="file"
          accept=".mp3,.wav,.m4a,.aac"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.input}
          disabled={loading}
        />
        <button 
          type="submit" 
          style={{...styles.button, ...(loading && styles.disabled)}}
          disabled={!file || loading}
        >
          {loading ? '⏳ Processando...' : '✨ Transcrever'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {result && (
        <div style={styles.results}>
          <h2>📝 Resultado:</h2>
          <div style={styles.transcription}>
            {result.timestamps.map((seg, i) => (
              <p key={i} style={styles.segment}>
                <span style={styles.time}>
                  [{formatTime(seg.start)} ➔ {formatTime(seg.end)}]
                </span>
                {seg.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Função auxiliar para formatar tempo
function formatTime(seconds) {
  return new Date(seconds * 1000).toISOString().substr(11, 8)
}

// Estilos
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  form: {
    border: '2px dashed #cbd5e0',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  input: {
    margin: '1rem 0',
    display: 'block',
    width: '100%'
  },
  button: {
    background: '#4299e1',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  disabled: {
    opacity: '0.7',
    cursor: 'not-allowed'
  },
  error: {
    color: '#e53e3e',
    background: '#fff5f5',
    padding: '1rem',
    borderRadius: '4px',
    margin: '1rem 0'
  },
  results: {
    background: '#f7fafc',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '2rem'
  },
  segment: {
    margin: '0.5rem 0',
    lineHeight: '1.6'
  },
  time: {
    color: '#718096',
    marginRight: '0.5rem'
  }
}
