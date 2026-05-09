import { useCallback, useEffect, useRef, useState } from 'react'
import { nursingApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import PageHeader from '../../components/ui/PageHeader'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'

// ── Config types ──────────────────────────────────────────────────────────────
const TYPE_CFG = {
  plaie:   { label: 'Plaie',   color: '#e67e22', bg: '#fff8f2', icon: '🩹' },
  diabete: { label: 'Diabète', color: '#3498db', bg: '#eff8ff', icon: '💉' },
  autre:   { label: 'Autre',   color: '#9b59b6', bg: '#f8f4ff', icon: '🔬' },
}
const typeCfg = t => TYPE_CFG[t] ?? { label: t ?? 'Autre', color: '#9b59b6', bg: '#f8f4ff', icon: '📷' }

const fmtDate = d => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputSt = {
  border: `1.5px solid ${colors.gray300}`,
  borderRadius: radius.sm,
  padding: '8px 12px',
  fontSize: '13px',
  color: colors.gray800,
  background: colors.white,
  outline: 'none',
  fontFamily: 'inherit',
}

// ══════════════════════════════════════════════════════════════════════════════
// LIGHTBOX
// ══════════════════════════════════════════════════════════════════════════════
function Lightbox({ images, index, onClose, onNav, onDelete, deleting }) {
  const img = images[index]
  if (!img) return null
  const tc = typeCfg(img.type)
  const hasPrev = index > 0
  const hasNext = index < images.length - 1
  const [zoom, setZoom] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  // Reset zoom on image change
  useEffect(() => { setZoom(false); setConfirmDel(false) }, [index])

  // Keyboard navigation
  useEffect(() => {
    const fn = e => {
      if (e.key === 'ArrowRight' && hasNext) onNav(index + 1)
      if (e.key === 'ArrowLeft'  && hasPrev) onNav(index - 1)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [index, hasPrev, hasNext])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5, 10, 20, 0.96)',
        display: 'flex', flexDirection: 'column',
        animation: 'lbIn .2s ease',
      }}
    >
      <style>{`
        @keyframes lbIn { from { opacity:0 } to { opacity:1 } }
        @keyframes imgIn { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:scale(1) } }
      `}</style>

      {/* ── Barre supérieure ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 24px',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        {/* Type badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          borderRadius: radius.full,
          background: tc.bg,
          color: tc.color,
          fontSize: '12px', fontWeight: 700,
          border: `1px solid ${tc.color}40`,
        }}>
          {tc.icon} {tc.label}
        </span>

        {/* Patient */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
            {img.patient_name}
          </div>
          {img.patient_code && (
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: 2 }}>
              {img.patient_code}
            </div>
          )}
        </div>

        {/* Compteur */}
        <div style={{
          color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 600,
          background: 'rgba(255,255,255,0.07)', borderRadius: radius.sm,
          padding: '4px 12px',
        }}>
          {index + 1} / {images.length}
        </div>

        {/* Zoom toggle */}
        <button
          onClick={() => setZoom(z => !z)}
          title={zoom ? 'Zoom arrière' : 'Zoom avant'}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: zoom ? 'rgba(255,118,49,0.25)' : 'rgba(255,255,255,0.09)',
            border: zoom ? '1.5px solid rgba(255,118,49,0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: zoom ? '#ff9a6b' : 'rgba(255,255,255,0.7)',
            fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {zoom ? '⊖' : '⊕'}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)', fontSize: '18px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* ── Corps ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Flèche gauche */}
        <button
          onClick={() => hasPrev && onNav(index - 1)}
          disabled={!hasPrev}
          style={{
            width: 68, flexShrink: 0,
            background: 'transparent', border: 'none', cursor: hasPrev ? 'pointer' : 'default',
            color: hasPrev ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.12)',
            fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color .15s',
          }}
          onMouseOver={e => { if (hasPrev) e.currentTarget.style.color = '#fff' }}
          onMouseOut={e => { e.currentTarget.style.color = hasPrev ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.12)' }}
        >❮</button>

        {/* Image */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: '16px 0',
        }}>
          <img
            key={img.url}
            src={img.url}
            alt={img.patient_name}
            style={{
              maxWidth: zoom ? '100%' : '82%',
              maxHeight: zoom ? '100%' : '88%',
              objectFit: 'contain',
              borderRadius: zoom ? 0 : radius.md,
              boxShadow: zoom ? 'none' : '0 24px 80px rgba(0,0,0,0.7)',
              cursor: zoom ? 'zoom-out' : 'zoom-in',
              transition: 'max-width .3s ease, max-height .3s ease, border-radius .3s',
              animation: 'imgIn .25s ease',
            }}
            onClick={() => setZoom(z => !z)}
          />
        </div>

        {/* Flèche droite */}
        <button
          onClick={() => hasNext && onNav(index + 1)}
          disabled={!hasNext}
          style={{
            width: 68, flexShrink: 0,
            background: 'transparent', border: 'none', cursor: hasNext ? 'pointer' : 'default',
            color: hasNext ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.12)',
            fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color .15s',
          }}
          onMouseOver={e => { if (hasNext) e.currentTarget.style.color = '#fff' }}
          onMouseOut={e => { e.currentTarget.style.color = hasNext ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.12)' }}
        >❯</button>
      </div>

      {/* ── Barre inférieure ── */}
      <div style={{
        padding: '14px 24px',
        background: 'rgba(255,255,255,0.04)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
      }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>📅</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{fmtDate(img.date)}</span>
        </div>

        {/* Observations */}
        {img.observations && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)', borderRadius: radius.sm,
            padding: '6px 12px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>📝</span>
            <span style={{
              color: 'rgba(255,255,255,0.65)', fontSize: '13px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{img.observations}</span>
          </div>
        )}

        <div style={{ marginLeft: 'auto' }}>
          {confirmDel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Confirmer la suppression ?</span>
              <button
                disabled={deleting}
                onClick={() => { onDelete(img); setConfirmDel(false) }}
                style={{
                  padding: '6px 16px', border: 'none', borderRadius: radius.sm,
                  background: '#e74c3c', color: '#fff',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                }}
              >{deleting ? '…' : 'Oui, supprimer'}</button>
              <button
                onClick={() => setConfirmDel(false)}
                style={{
                  padding: '6px 14px', borderRadius: radius.sm,
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer',
                }}
              >Annuler</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', border: '1px solid rgba(231,76,60,0.4)',
                borderRadius: radius.sm, background: 'rgba(231,76,60,0.15)',
                color: '#e98080', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all .15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.3)'; e.currentTarget.style.color = '#fca5a5' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.15)'; e.currentTarget.style.color = '#e98080' }}
            >🗑 Supprimer</button>
          )}
        </div>
      </div>

      {/* Miniatures strip */}
      {images.length > 1 && (
        <div style={{
          display: 'flex', gap: 6, padding: '10px 24px 14px',
          overflowX: 'auto', flexShrink: 0,
          background: 'rgba(0,0,0,0.3)',
        }}>
          {images.map((im, i) => (
            <button
              key={im.key}
              onClick={() => onNav(i)}
              style={{
                width: 54, height: 54, flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer',
                borderRadius: 8,
                outline: i === index ? `2.5px solid #ff7631` : '2.5px solid transparent',
                outlineOffset: 2,
                overflow: 'hidden',
                opacity: i === index ? 1 : 0.45,
                transition: 'opacity .15s, outline-color .15s',
              }}
            >
              <img src={im.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// UPLOAD MODAL
// ══════════════════════════════════════════════════════════════════════════════
function UploadModal({ open, onClose, onUploaded }) {
  const [dossiers,    setDossiers]    = useState([])
  const [loadingDoss, setLoadingDoss] = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [preview,     setPreview]     = useState(null)
  const [dragOver,    setDragOver]    = useState(false)
  const fileRef = useRef()

  const [form, setForm] = useState({
    dossier_id:    '',
    type:          'plaie',
    date:          new Date().toISOString().slice(0, 10),
    observations:  '',
  })
  const [file, setFile] = useState(null)

  // Charger dossiers en cours
  useEffect(() => {
    if (!open) return
    setLoadingDoss(true)
    nursingApi.liste({ statut: 'en_cours', per_page: 200 })
      .then(res => setDossiers(res.data?.data?.data ?? []))
      .catch(() => setDossiers([]))
      .finally(() => setLoadingDoss(false))
  }, [open])

  // Reset à la fermeture
  useEffect(() => {
    if (!open) { setFile(null); setPreview(null); setForm(f => ({ ...f, dossier_id: '', observations: '' })) }
  }, [open])

  const pickFile = f => {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) pickFile(f)
  }

  const handleSubmit = async () => {
    if (!form.dossier_id) { showToast('Sélectionnez un dossier patient', 'error'); return }
    if (!file)             { showToast('Ajoutez une image', 'error'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('dossier_id',   form.dossier_id)
      fd.append('type',         form.type)
      fd.append('date',         form.date)
      fd.append('observations', form.observations)
      fd.append('image',        file)
      const res = await nursingApi.quickUpload(fd)
      showToast('Image ajoutée avec succès')
      onUploaded(res.data?.data)
      onClose()
    } catch {
      showToast("Erreur lors de l'upload", 'error')
    } finally {
      setUploading(false)
    }
  }

  if (!open) return null

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(10,18,36,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'lbIn .18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        boxShadow: shadows.lg ?? '0 24px 80px rgba(0,0,0,0.35)',
        width: '100%', maxWidth: 560,
        overflow: 'hidden',
        animation: 'imgIn .2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #003268 0%, #001e3d 100%)',
          color: '#fff',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px' }}>📸 Ajouter une image</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              Sélectionnez un dossier et importez votre photo médicale
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: '#fff', fontSize: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Dossier patient */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gray700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              Dossier patient *
            </label>
            {loadingDoss ? (
              <div style={{ fontSize: '13px', color: colors.gray400 }}>Chargement…</div>
            ) : (
              <select
                name="dossier_id"
                value={form.dossier_id}
                onChange={ch}
                style={{ ...inputSt, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
              >
                <option value="">-- Sélectionner un dossier --</option>
                {dossiers.map(d => {
                  const p = d.patient
                  const nom = p ? (p.patient_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) : `Dossier #${d.id}`
                  const code = p?.patient_code ? ` (${p.patient_code})` : ''
                  return <option key={d.id} value={d.id}>{nom}{code}</option>
                })}
              </select>
            )}
          </div>

          {/* Type + Date en ligne */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gray700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Type</label>
              <select name="type" value={form.type} onChange={ch}
                style={{ ...inputSt, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
                <option value="plaie">🩹 Plaie</option>
                <option value="diabete">💉 Diabète</option>
                <option value="autre">🔬 Autre</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gray700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Date</label>
              <input type="date" name="date" value={form.date} onChange={ch}
                style={{ ...inputSt, width: '100%', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e => e.target.style.borderColor = colors.gray300} />
            </div>
          </div>

          {/* Observations */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gray700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
              Observations <span style={{ fontWeight: 400, color: colors.gray400, textTransform: 'none' }}>(optionnel)</span>
            </label>
            <textarea
              name="observations"
              value={form.observations}
              onChange={ch}
              rows={2}
              placeholder="Description de la plaie, évolution…"
              style={{ ...inputSt, width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = colors.bleu}
              onBlur={e => e.target.style.borderColor = colors.gray300}
            />
          </div>

          {/* Zone upload */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.gray700, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>
              Image *
            </label>

            {preview ? (
              /* Preview */
              <div style={{ position: 'relative', borderRadius: radius.md, overflow: 'hidden', border: `2px solid ${colors.bleu}20` }}>
                <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => { setFile(null); setPreview(null) }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: '#fff', fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '8px 12px',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  color: '#fff', fontSize: '12px',
                }}>{file?.name}</div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? colors.bleu : colors.gray300}`,
                  borderRadius: radius.md,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? `${colors.bleu}08` : colors.gray50,
                  transition: 'all .2s',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: 8 }}>📷</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: colors.gray700, marginBottom: 4 }}>
                  Glisser-déposer ou <span style={{ color: colors.bleu, textDecoration: 'underline' }}>parcourir</span>
                </div>
                <div style={{ fontSize: '12px', color: colors.gray400 }}>
                  JPEG, PNG, WEBP — max 5 MB
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => pickFile(e.target.files[0])}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          padding: '14px 24px',
          borderTop: `1px solid ${colors.gray200}`,
          background: colors.gray50,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm, background: colors.white,
              color: colors.gray600, fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Annuler</button>
          <button
            disabled={uploading || !file || !form.dossier_id}
            onClick={handleSubmit}
            style={{
              padding: '9px 24px', border: 'none',
              borderRadius: radius.sm,
              background: uploading || !file || !form.dossier_id
                ? colors.gray300
                : 'linear-gradient(135deg, #003268 0%, #0050a0 100%)',
              color: uploading || !file || !form.dossier_id ? colors.gray500 : '#fff',
              fontSize: '13px', fontWeight: 700,
              cursor: uploading || !file || !form.dossier_id ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all .15s',
            }}
          >
            {uploading ? '⏳ Upload…' : '📤 Enregistrer l\'image'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CARD IMAGE
// ══════════════════════════════════════════════════════════════════════════════
function ImageCard({ img, onOpen }) {
  const [hovered, setHovered] = useState(false)
  const tc = typeCfg(img.type)

  return (
    <div
      onClick={() => onOpen()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: radius.md,
        overflow: 'hidden',
        background: colors.white,
        boxShadow: hovered ? shadows.md ?? '0 8px 32px rgba(0,0,0,0.14)' : shadows.sm,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-3px) scale(1.01)' : 'none',
        transition: 'all .22s cubic-bezier(0.34,1.56,0.64,1)',
        border: `1px solid ${hovered ? tc.color + '50' : colors.gray200}`,
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '72%', overflow: 'hidden' }}>
        <img
          src={img.url}
          alt={img.patient_name}
          loading="lazy"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transition: 'transform .3s ease',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
          }}
        />
        {/* Overlay au hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: hovered
            ? 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)'
            : 'linear-gradient(0deg, rgba(0,0,0,0.32) 0%, transparent 55%)',
          transition: 'background .2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {hovered && (
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              animation: 'popIn .15s ease',
            }}>🔍</div>
          )}
        </div>
        {/* Badge type */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px',
          borderRadius: radius.full,
          background: tc.bg,
          color: tc.color,
          fontSize: '11px', fontWeight: 700,
          border: `1px solid ${tc.color}30`,
          backdropFilter: 'blur(4px)',
        }}>
          {tc.icon} {tc.label}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontWeight: 700, fontSize: '13px',
          color: colors.gray800,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {img.patient_name}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 5,
        }}>
          <span style={{ fontSize: '11px', color: colors.gray500 }}>
            📅 {new Date(img.date).toLocaleDateString('fr-FR')}
          </span>
          {img.patient_code && (
            <span style={{
              fontSize: '10px', color: colors.bleu,
              background: `${colors.bleu}12`,
              padding: '2px 7px', borderRadius: 999, fontWeight: 600,
            }}>{img.patient_code}</span>
          )}
        </div>
        {img.observations && (
          <div style={{
            marginTop: 6, fontSize: '11px', color: colors.gray500,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            lineHeight: 1.4,
          }}>
            {img.observations}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function ImagesNursingPage() {
  const [images,   setImages]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [lightbox, setLightbox] = useState(null) // index
  const [deleting, setDeleting] = useState(false)
  const [upload,   setUpload]   = useState(false)

  const [filters, setFilters] = useState({
    type: '', search: '', date_debut: '', date_fin: '',
  })

  // ── Chargement ────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await nursingApi.imagesGallery(filters)
      setImages(res.data?.data ?? [])
    } catch {
      showToast('Erreur de chargement de la galerie', 'error')
      setImages([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  // ── Supprimer une image ───────────────────────────────────
  const handleDelete = async (img) => {
    setDeleting(true)
    try {
      await nursingApi.deleteImage(img.dossier_id, img.surveillance_id, img.path)
      showToast('Image supprimée')
      const next = images.filter(i => i.key !== img.key)
      setImages(next)
      if (next.length === 0) setLightbox(null)
      else if (lightbox >= next.length) setLightbox(next.length - 1)
    } catch {
      showToast('Erreur lors de la suppression', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── Upload terminé ────────────────────────────────────────
  const handleUploaded = (newImg) => {
    if (newImg) setImages(prev => [newImg, ...prev])
  }

  const fch = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }))
  const clearFilters = () => setFilters({ type: '', search: '', date_debut: '', date_fin: '' })
  const hasFilters = filters.type || filters.search || filters.date_debut || filters.date_fin

  // ── Stats ──────────────────────────────────────────────────
  const stats = [
    { label: 'Total images', value: images.length,                                       color: '#003268', bg: '#eff3fb', icon: '🖼️' },
    { label: 'Plaies',       value: images.filter(i => i.type === 'plaie').length,        color: '#e67e22', bg: '#fff8f2', icon: '🩹' },
    { label: 'Diabète',      value: images.filter(i => i.type === 'diabete').length,      color: '#3498db', bg: '#eff8ff', icon: '💉' },
    { label: 'Autres',       value: images.filter(i => !['plaie','diabete'].includes(i.type)).length, color: '#9b59b6', bg: '#f8f4ff', icon: '🔬' },
  ]

  return (
    <div>
      <style>{`
        @keyframes lbIn  { from { opacity:0 }                             to { opacity:1 } }
        @keyframes imgIn { from { opacity:0; transform:scale(.96) }       to { opacity:1; transform:scale(1) } }
        @keyframes popIn { from { opacity:0; transform:scale(.5) }        to { opacity:1; transform:scale(1) } }
        @keyframes fadeUp{ from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* ── En-tête ───────────────────────────────────────── */}
      <PageHeader
        title="Galerie d'images médicales"
        subtitle="Visualisez et gérez toutes les images nursing — plaies, diabète et suivis"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={load}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                border: `1.5px solid ${colors.gray300}`,
                borderRadius: radius.sm,
                background: colors.white,
                fontSize: '13px', fontWeight: 600, color: colors.gray700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseOver={e => e.currentTarget.style.background = colors.gray100}
              onMouseOut={e => e.currentTarget.style.background = colors.white}
            >↻ Actualiser</button>
            <button
              onClick={() => setUpload(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 20px',
                border: 'none',
                borderRadius: radius.sm,
                background: 'linear-gradient(135deg, #003268 0%, #0050a0 100%)',
                color: '#fff',
                fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(0,50,104,0.35)',
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,50,104,0.45)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,50,104,0.35)' }}
            >📸 Ajouter une image</button>
          </div>
        }
      />

      {/* ── Stats ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: spacing.md, marginBottom: spacing.lg,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.bg,
            border: `1.5px solid ${s.color}22`,
            borderRadius: radius.md,
            padding: `16px ${spacing.lg}`,
            boxShadow: shadows.sm,
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'fadeUp .3s ease',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: `${s.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px',
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: s.color, fontWeight: 600, marginTop: 3, opacity: 0.8 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ───────────────────────────────────────── */}
      <div style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radius.md,
        boxShadow: shadows.sm,
        padding: `${spacing.sm} ${spacing.lg}`,
        marginBottom: spacing.lg,
        display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Recherche */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: colors.gray400, pointerEvents: 'none',
          }}>🔍</span>
          <input
            name="search"
            value={filters.search}
            onChange={fch}
            placeholder="Nom patient, code…"
            style={{ ...inputSt, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300}
          />
        </div>

        {/* Type */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { v: '',        l: 'Tout' },
            { v: 'plaie',   l: '🩹 Plaie' },
            { v: 'diabete', l: '💉 Diabète' },
            { v: 'autre',   l: '🔬 Autre' },
          ].map(({ v, l }) => {
            const active = filters.type === v
            const tc = v ? typeCfg(v) : null
            return (
              <button
                key={v}
                onClick={() => setFilters(f => ({ ...f, type: v }))}
                style={{
                  padding: '7px 14px',
                  border: `1.5px solid ${active ? (tc?.color ?? colors.bleu) : colors.gray300}`,
                  borderRadius: radius.sm,
                  background: active ? (tc?.bg ?? '#eff3fb') : colors.white,
                  color: active ? (tc?.color ?? colors.bleu) : colors.gray600,
                  fontSize: '12px', fontWeight: active ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s',
                }}
              >{l}</button>
            )
          })}
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" name="date_debut" value={filters.date_debut} onChange={fch}
            style={{ ...inputSt, fontSize: '12px' }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300} />
          <span style={{ color: colors.gray400, fontSize: '12px' }}>→</span>
          <input type="date" name="date_fin" value={filters.date_fin} onChange={fch}
            style={{ ...inputSt, fontSize: '12px' }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300} />
        </div>

        {hasFilters && (
          <button onClick={clearFilters} style={{
            ...inputSt, cursor: 'pointer', color: colors.gray600,
            fontWeight: 600, minWidth: 'auto',
          }}>× Effacer</button>
        )}
      </div>

      {/* ── Galerie ───────────────────────────────────────── */}
      {loading ? (
        <FullPageSpinner />
      ) : images.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radius.md,
          color: colors.gray500,
        }}>
          <div style={{ fontSize: '56px', marginBottom: 16 }}>🖼️</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: colors.gray700, marginBottom: 8 }}>
            Aucune image trouvée
          </div>
          <div style={{ fontSize: '13px', marginBottom: 24 }}>
            {hasFilters ? 'Essayez de modifier vos filtres.' : 'Ajoutez votre première image médicale.'}
          </div>
          {!hasFilters && (
            <button
              onClick={() => setUpload(true)}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: radius.sm,
                background: 'linear-gradient(135deg, #003268 0%, #0050a0 100%)',
                color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}
            >📸 Ajouter une image</button>
          )}
        </div>
      ) : (
        <>
          {/* Compteur */}
          <div style={{
            fontSize: '12px', color: colors.gray500, marginBottom: 14,
            fontWeight: 500,
          }}>
            {images.length} image{images.length > 1 ? 's' : ''} trouvée{images.length > 1 ? 's' : ''}
          </div>

          {/* Grille */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: spacing.md,
          }}>
            {images.map((img, i) => (
              <div key={img.key} style={{ animation: `fadeUp ${0.1 + i * 0.03}s ease` }}>
                <ImageCard img={img} onOpen={() => setLightbox(i)} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Lightbox ──────────────────────────────────────── */}
      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNav={i => setLightbox(i)}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}

      {/* ── Modal upload ──────────────────────────────────── */}
      <UploadModal
        open={upload}
        onClose={() => setUpload(false)}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
