import { useState, useEffect, useRef, useCallback } from 'react'
import { colors, radius, shadows, typography } from '../../theme'
import { ficheAttApi } from '../../api'

// ── Constantes ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'EXAMEN',      label: '🔬 Examen', color: '#1565c0' },
  { value: 'RADIO',       label: '🩻 Radio',  color: '#6a1b9a' },
  { value: 'SCANNER',     label: '⚙️ Scanner', color: '#37474f' },
  { value: 'ECHO',        label: '🔊 Écho',   color: '#00838f' },
  { value: 'ANALYSE',     label: '🧪 Analyse', color: '#2e7d32' },
  { value: 'ORDONNANCE',  label: '📋 Ordonnance', color: '#f57c00' },
  { value: 'AUTRE',       label: '📁 Autre',  color: '#757575' },
]

const MAX_MB   = 20
const MAX_BYTES = MAX_MB * 1024 * 1024

const ACCEPT = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  '.doc', '.docx', '.xls', '.xlsx',
].join(',')

// ── Icônes selon le type MIME ─────────────────────────────────────────────────
function fileIcon(mime = '') {
  if (mime.startsWith('image/'))      return '🖼️'
  if (mime === 'application/pdf')     return '📄'
  if (mime.includes('word'))          return '📝'
  if (mime.includes('excel') || mime.includes('sheet')) return '📊'
  return '📁'
}

function catColor(val) {
  return CATEGORIES.find(c => c.value === val)?.color ?? '#757575'
}

function fmtSize(bytes = 0) {
  if (bytes < 1024)       return `${bytes} o`
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1048576).toFixed(1)} Mo`
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Vignette d'un fichier ─────────────────────────────────────────────────────
function FileTile({ fiche, onDelete, onPreview }) {
  const [hov, setHov] = useState(false)
  const isImg = fiche.is_image
  const cc    = catColor(fiche.categorie)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: radius.md, overflow: 'hidden',
        border: `2px solid ${hov ? cc : colors.gray200}`,
        transition: 'all 0.18s', cursor: 'pointer',
        boxShadow: hov ? shadows.md : shadows.sm,
        background: '#fff',
      }}
    >
      {/* Zone image / icône */}
      <div
        onClick={() => onPreview(fiche)}
        style={{
          height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isImg ? '#000' : `${cc}10`, position: 'relative', overflow: 'hidden',
        }}
      >
        {isImg ? (
          <img
            src={ficheAttApi.serveUrl(fiche.id_fiche)}
            alt={fiche.nom_fichier}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: hov ? 0.85 : 1 }}
          />
        ) : (
          <span style={{ fontSize: 38 }}>{fileIcon(fiche.type_mime)}</span>
        )}
        {/* Badge source WEBCAM */}
        {fiche.source === 'WEBCAM' && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            background: '#1565c0', color: '#fff',
            fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 20,
          }}>📷 WEBCAM</span>
        )}
        {/* Loupe au survol */}
        {hov && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>🔍</div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: '7px 10px' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: colors.gray800,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{fiche.nom_fichier}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
            background: `${cc}15`, color: cc,
          }}>
            {CATEGORIES.find(c => c.value === fiche.categorie)?.label?.replace(/^\S+\s/, '') ?? fiche.categorie}
          </span>
          <span style={{ fontSize: 9, color: colors.gray500 }}>{fmtSize(fiche.taille)}</span>
        </div>
        <div style={{ fontSize: 9, color: colors.gray400, marginTop: 2 }}>
          {fmtDate(fiche.created_at)}
        </div>
      </div>

      {/* Bouton supprimer */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(fiche) }}
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 22, height: 22, borderRadius: '50%',
          background: hov ? colors.danger : 'rgba(0,0,0,0.35)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
        }}
        title="Supprimer"
      >✕</button>
    </div>
  )
}

// ── Modale de prévisualisation ────────────────────────────────────────────────
function PreviewModal({ fiche, onClose }) {
  if (!fiche) return null
  const isImg = fiche.is_image
  const isPdf = fiche.is_pdf
  const url   = ficheAttApi.serveUrl(fiche.id_fiche)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: radius.lg,
          maxWidth: '90vw', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: shadows.xl, overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 20px', background: colors.bleu,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{fiche.nom_fichier}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              {fmtDate(fiche.created_at)} · {fmtSize(fiche.taille)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a
              href={url}
              download={fiche.nom_fichier}
              style={{
                padding: '5px 12px', borderRadius: radius.sm,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none',
              }}
            >⬇ Télécharger</a>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflow: 'auto', background: '#111' }}>
          {isImg && (
            <img
              src={url}
              alt={fiche.nom_fichier}
              style={{ display: 'block', maxWidth: '85vw', maxHeight: '75vh', margin: 'auto', objectFit: 'contain' }}
            />
          )}
          {isPdf && (
            <iframe
              src={url}
              title={fiche.nom_fichier}
              style={{ width: '80vw', height: '75vh', border: 'none', background: '#fff' }}
            />
          )}
          {!isImg && !isPdf && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 60, gap: 16, color: '#fff',
            }}>
              <span style={{ fontSize: 64 }}>{fileIcon(fiche.type_mime)}</span>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Aperçu non disponible pour ce type de fichier.</div>
              <a
                href={url}
                download={fiche.nom_fichier}
                style={{
                  padding: '10px 24px', borderRadius: radius.sm,
                  background: colors.orange, color: '#fff',
                  textDecoration: 'none', fontWeight: 700, fontSize: 13,
                }}
              >⬇ Télécharger le fichier</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function FicheAttModal({ onClose, showToast, patientId, patientName, adtId }) {
  // Fichiers existants
  const [fiches, setFiches]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filterCat, setFilterCat] = useState('')

  // Upload
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categorie, setCategorie] = useState('EXAMEN')
  const [description, setDesc]    = useState('')
  const fileInputRef              = useRef(null)

  // Prévisualisation
  const [preview, setPreview]     = useState(null)

  // Webcam
  const [webcamMode, setWebcamMode] = useState(false)
  const [camActive, setCamActive]   = useState(false)
  const [camError, setCamError]     = useState('')
  const [captured, setCaptured]     = useState(null) // data URL
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // ── Chargement des fichiers ────────────────────────────────────────────────
  const loadFiches = useCallback(() => {
    setLoading(true)
    const params = { patient_id: patientId }
    if (adtId) params.adt_id = adtId
    ficheAttApi.liste(params)
      .then(r => setFiches(r.data?.data ?? []))
      .catch(() => showToast('Erreur lors du chargement des fichiers.', 'error'))
      .finally(() => setLoading(false))
  }, [patientId, adtId])

  useEffect(() => { loadFiches() }, [loadFiches])

  // ── Nettoyage webcam à la fermeture ───────────────────────────────────────
  useEffect(() => {
    return () => stopWebcam()
  }, [])

  // ── Upload fichier ─────────────────────────────────────────────────────────
  const uploadFile = async (file) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      showToast(`Fichier trop lourd (max ${MAX_MB} Mo).`, 'error')
      return
    }
    const fd = new FormData()
    fd.append('fichier',    file)
    fd.append('patient_id', patientId)
    fd.append('categorie',  categorie)
    if (adtId)      fd.append('adt_id',      adtId)
    if (description) fd.append('description', description)

    setUploading(true)
    try {
      await ficheAttApi.uploader(fd)
      showToast('Fichier uploadé avec succès.', 'success')
      setDesc('')
      loadFiches()
    } catch (err) {
      showToast(err.response?.data?.message ?? "Erreur lors de l'upload.", 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = async (fiche) => {
    if (!window.confirm(`Supprimer "${fiche.nom_fichier}" ?`)) return
    try {
      await ficheAttApi.supprimer(fiche.id_fiche)
      showToast('Fichier supprimé.', 'success')
      loadFiches()
    } catch {
      showToast('Erreur lors de la suppression.', 'error')
    }
  }

  // ── Webcam ─────────────────────────────────────────────────────────────────
  const startWebcam = async () => {
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCamActive(true)
      setCaptured(null)
    } catch (err) {
      setCamError("Impossible d'accéder à la caméra : " + err.message)
    }
  }

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCamActive(false)
  }

  const capturePhoto = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    setCaptured(canvas.toDataURL('image/jpeg', 0.85))
  }

  const resetCapture = () => {
    setCaptured(null)
    if (!camActive) startWebcam()
  }

  const saveCapture = async () => {
    if (!captured) return
    const base64 = captured.split(',')[1]
    const nom    = `webcam_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.jpg`

    setUploading(true)
    try {
      await ficheAttApi.webcam({
        patient_id:   patientId,
        image_base64: base64,
        nom_fichier:  nom,
        categorie,
        adt_id:       adtId ?? undefined,
        description:  description || undefined,
      })
      showToast('Capture enregistrée.', 'success')
      setCaptured(null)
      setDesc('')
      stopWebcam()
      setWebcamMode(false)
      loadFiches()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la sauvegarde.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleWebcam = () => {
    if (webcamMode) {
      stopWebcam()
      setCaptured(null)
      setCamError('')
    } else {
      setTimeout(startWebcam, 100)
    }
    setWebcamMode(v => !v)
  }

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const fichesFiltrees = filterCat ? fiches.filter(f => f.categorie === filterCat) : fiches

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div style={{
          background: '#fff', borderRadius: radius.lg,
          width: '100%', maxWidth: 980,
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: shadows.xl,
        }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{
            padding: '16px 24px',
            background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
            borderRadius: `${radius.lg} ${radius.lg} 0 0`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: radius.md,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>📎</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  Fiches d'Attachement
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 }}>
                  Patient : {patientName}
                  {adtId && <span style={{ marginLeft: 8, opacity: 0.7 }}>· Visite #{adtId}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Compteur */}
              <span style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                borderRadius: radius.full, padding: '3px 12px', fontSize: 12, fontWeight: 700,
              }}>
                {fiches.length} fichier{fiches.length !== 1 ? 's' : ''}
              </span>
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          </div>

          {/* ── Corps ───────────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Zone d'upload + webcam */}
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${colors.gray200}`,
              background: colors.gray50,
            }}>
              {/* Sélecteurs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray600, display: 'block', marginBottom: 4 }}>
                    Catégorie
                  </label>
                  <select
                    value={categorie}
                    onChange={e => setCategorie(e.target.value)}
                    style={{
                      padding: '7px 10px', borderRadius: radius.sm,
                      border: `1.5px solid ${colors.gray300}`,
                      fontSize: 12, background: '#fff', cursor: 'pointer', minWidth: 140,
                    }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray600, display: 'block', marginBottom: 4 }}>
                    Description (optionnel)
                  </label>
                  <input
                    value={description}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Notes sur le fichier..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '7px 10px', borderRadius: radius.sm,
                      border: `1.5px solid ${colors.gray300}`,
                      fontSize: 12, background: '#fff',
                    }}
                  />
                </div>
                {/* Bouton Webcam */}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={handleToggleWebcam}
                    style={{
                      padding: '7px 16px', borderRadius: radius.sm, cursor: 'pointer',
                      border: `1.5px solid ${webcamMode ? colors.danger : '#1565c0'}`,
                      background: webcamMode ? `${colors.danger}15` : '#1565c015',
                      color: webcamMode ? colors.danger : '#1565c0',
                      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >
                    {webcamMode ? '⏹ Fermer Webcam' : '📷 Ouvrir Webcam'}
                  </button>
                </div>
              </div>

              {/* Mode webcam */}
              {webcamMode ? (
                <div style={{
                  border: `2px solid #1565c0`,
                  borderRadius: radius.md,
                  overflow: 'hidden',
                  background: '#000',
                }}>
                  {/* Barre webcam */}
                  <div style={{
                    padding: '8px 14px',
                    background: '#1565c0',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                      📷 Capture Webcam
                    </span>
                    {camActive && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 10, color: 'rgba(255,255,255,0.8)',
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: '#4caf50',
                          animation: 'pulse 1.2s infinite',
                        }} />
                        Caméra active
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 0 }}>
                    {/* Vidéo + canvas */}
                    <div style={{ flex: 1, position: 'relative', minHeight: 240 }}>
                      {camError ? (
                        <div style={{
                          height: 240, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 10,
                          color: colors.danger, padding: 24, textAlign: 'center',
                        }}>
                          <span style={{ fontSize: 32 }}>📵</span>
                          <div style={{ fontSize: 12 }}>{camError}</div>
                          <button
                            onClick={startWebcam}
                            style={{
                              padding: '6px 16px', borderRadius: radius.sm,
                              background: colors.bleu, color: '#fff', border: 'none',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}
                          >Réessayer</button>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                              width: '100%', maxHeight: 280,
                              display: captured ? 'none' : 'block',
                              objectFit: 'cover',
                            }}
                          />
                          {captured && (
                            <img
                              src={captured}
                              alt="Capture"
                              style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
                            />
                          )}
                          <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </>
                      )}
                    </div>

                    {/* Contrôles webcam */}
                    <div style={{
                      width: 160, padding: '16px 12px',
                      display: 'flex', flexDirection: 'column', gap: 10,
                      background: '#0d1b2a', borderLeft: '1px solid #1a2d42',
                    }}>
                      {!captured ? (
                        <WebcamBtn
                          label="📸 Capturer"
                          color="#4caf50"
                          disabled={!camActive || uploading}
                          onClick={capturePhoto}
                        />
                      ) : (
                        <>
                          <WebcamBtn
                            label={uploading ? '⏳ Sauvegarde...' : '✔ Sauvegarder'}
                            color="#4caf50"
                            disabled={uploading}
                            onClick={saveCapture}
                          />
                          <WebcamBtn
                            label="🔄 Reprendre"
                            color="#f57c00"
                            disabled={uploading}
                            onClick={resetCapture}
                          />
                        </>
                      )}
                      {!camActive && !camError && (
                        <WebcamBtn
                          label="▶ Démarrer"
                          color="#1565c0"
                          onClick={startWebcam}
                        />
                      )}
                      <div style={{
                        marginTop: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.35)',
                        lineHeight: '14px', textAlign: 'center',
                      }}>
                        La capture sera enregistrée en JPEG dans la catégorie sélectionnée.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Zone drag & drop */
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? colors.orange : uploading ? colors.success : colors.gray300}`,
                    borderRadius: radius.md,
                    padding: '24px 20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    cursor: uploading ? 'default' : 'pointer',
                    background: dragging ? `${colors.orange}08` : uploading ? `${colors.success}08` : `${colors.bleu}04`,
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {uploading ? (
                    <>
                      <div style={{ fontSize: 32 }}>⏳</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.success }}>
                        Upload en cours...
                      </div>
                    </>
                  ) : dragging ? (
                    <>
                      <div style={{ fontSize: 36 }}>📂</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>
                        Déposez le fichier ici
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 32 }}>⬆️</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.bleu }}>
                        Glissez-déposez un fichier ou <span style={{ color: colors.orange, textDecoration: 'underline' }}>cliquez pour parcourir</span>
                      </div>
                      <div style={{ fontSize: 11, color: colors.gray500 }}>
                        Images (JPG, PNG, WEBP), PDF, Word, Excel — max {MAX_MB} Mo
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Filtres + grille */}
            <div style={{ padding: '14px 24px' }}>
              {/* Filtres catégories */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.gray600, marginRight: 4 }}>Filtrer :</span>
                <CatChip
                  label="Tous"
                  active={!filterCat}
                  count={fiches.length}
                  color={colors.bleu}
                  onClick={() => setFilterCat('')}
                />
                {CATEGORIES.filter(c => fiches.some(f => f.categorie === c.value)).map(c => (
                  <CatChip
                    key={c.value}
                    label={c.label}
                    active={filterCat === c.value}
                    count={fiches.filter(f => f.categorie === c.value).length}
                    color={c.color}
                    onClick={() => setFilterCat(filterCat === c.value ? '' : c.value)}
                  />
                ))}
              </div>

              {/* Grille */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: colors.gray500, fontSize: 13 }}>
                  Chargement...
                </div>
              ) : fichesFiltrees.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  color: colors.gray400, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
                }}>
                  <span style={{ fontSize: 40 }}>📂</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray500 }}>
                    {filterCat ? 'Aucun fichier dans cette catégorie' : 'Aucun fichier pour ce patient'}
                  </div>
                  <div style={{ fontSize: 11, color: colors.gray400 }}>
                    Utilisez la zone ci-dessus pour uploader ou capturer.
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
                  gap: 12,
                }}>
                  {fichesFiltrees.map(fiche => (
                    <FileTile
                      key={fiche.id_fiche}
                      fiche={fiche}
                      onDelete={handleDelete}
                      onPreview={setPreview}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{
            padding: '12px 24px', borderTop: `1px solid ${colors.gray200}`,
            background: colors.gray50,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 11, color: colors.gray500 }}>
              {fichesFiltrees.length} fichier{fichesFiltrees.length !== 1 ? 's' : ''}
              {filterCat && ` dans "${CATEGORIES.find(c => c.value === filterCat)?.label ?? filterCat}"`}
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px 22px', borderRadius: radius.sm, cursor: 'pointer',
                background: colors.bleu, border: 'none',
                color: '#fff', fontSize: 12, fontWeight: 700,
              }}
            >Fermer</button>
          </div>
        </div>
      </div>

      {/* Modale de prévisualisation */}
      {preview && <PreviewModal fiche={preview} onClose={() => setPreview(null)} />}
    </>
  )
}

// ── Petits composants locaux ───────────────────────────────────────────────────
function WebcamBtn({ label, color, onClick, disabled }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: '100%', padding: '8px 0', borderRadius: radius.sm, cursor: disabled ? 'not-allowed' : 'pointer',
        background: h && !disabled ? color : `${color}25`,
        border: `1.5px solid ${color}80`,
        color: h && !disabled ? '#fff' : color,
        fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >{label}</button>
  )
}

function CatChip({ label, active, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px', borderRadius: radius.full, cursor: 'pointer',
        border: `1.5px solid ${active ? color : colors.gray300}`,
        background: active ? `${color}15` : '#fff',
        color: active ? color : colors.gray600,
        fontSize: 11, fontWeight: active ? 700 : 500,
        display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
      }}
    >
      {label}
      <span style={{
        fontSize: 9, fontWeight: 700,
        background: active ? color : colors.gray200,
        color: active ? '#fff' : colors.gray600,
        borderRadius: radius.full, padding: '1px 5px',
      }}>{count}</span>
    </button>
  )
}
