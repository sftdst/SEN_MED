import { useState, useEffect, useRef, useCallback } from 'react'
import { colors, shadows, radius } from '../../theme'
import { formulaireApi } from '../../api'

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  navy:    colors.bleu,
  orange:  colors.orange,
  bg:      '#f4f6fa',
  white:   '#ffffff',
  border:  '#d1d9e6',
  text:    '#1e293b',
  muted:   '#64748b',
  rowHov:  '#eef2ff',
  system:  '#3b5bdb',
}

// ── Bouton réutilisable ────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', disabled, small, style: sx }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '5px 12px' : '7px 18px',
    borderRadius: 7, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontSize: small ? 12 : 13,
    transition: 'all 0.15s ease', opacity: disabled ? 0.55 : 1,
    ...sx,
  }
  const variants = {
    primary:  { background: C.navy,   color: '#fff' },
    orange:   { background: C.orange, color: '#fff' },
    ghost:    { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
    danger:   { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
    success:  { background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' },
  }
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

// ── Toolbar WYSIWYG ────────────────────────────────────────────────────────
const FONTS = ['Times New Roman', 'Arial', 'Georgia', 'Verdana', 'Courier New']
const SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32']

function ToolbarBtn({ title, onClick, active, children }) {
  return (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      style={{
        padding: '3px 7px', border: `1px solid ${active ? C.navy : C.border}`,
        borderRadius: 4, background: active ? '#e0e7ff' : C.white,
        cursor: 'pointer', fontSize: 13, fontWeight: 700,
        color: active ? C.navy : C.text,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 26, height: 26,
      }}
    >
      {children}
    </button>
  )
}

function WysiwygToolbar({ editorRef }) {
  const exec = (cmd, val) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
  }

  const [font, setFont] = useState('Times New Roman')
  const [size, setSize] = useState('12')

  const applyFont = (f) => { setFont(f); exec('fontName', f) }
  const applySize = (s) => {
    setSize(s)
    // execCommand fontSize takes 1-7, we map via span
    const sel = window.getSelection()
    if (!sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.style.fontSize = `${s}pt`
    range.surroundContents(span)
  }

  const select = (items, val, onChange, w) => (
    <select
      value={val}
      onChange={e => onChange(e.target.value)}
      onMouseDown={e => e.stopPropagation()}
      style={{
        height: 26, border: `1px solid ${C.border}`, borderRadius: 4,
        fontSize: 12, padding: '0 4px', width: w,
        background: C.white, cursor: 'pointer',
      }}
    >
      {items.map(i => <option key={i} value={i}>{i}</option>)}
    </select>
  )

  const divider = <span style={{ width: 1, background: C.border, height: 20, margin: '0 4px' }} />

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
      padding: '6px 10px', background: '#f8fafc',
      borderBottom: `1px solid ${C.border}`,
    }}>
      {select(FONTS, font, applyFont, 140)}
      {select(SIZES, size, applySize, 52)}
      {divider}
      <ToolbarBtn title="Gras" onClick={() => exec('bold')}><b>G</b></ToolbarBtn>
      <ToolbarBtn title="Italique" onClick={() => exec('italic')}><i>/</i></ToolbarBtn>
      <ToolbarBtn title="Souligné" onClick={() => exec('underline')}><u style={{ textDecorationThickness: 2 }}>S</u></ToolbarBtn>
      <ToolbarBtn title="Barré" onClick={() => exec('strikeThrough')}><s>ab</s></ToolbarBtn>
      {divider}
      <ToolbarBtn title="Couleur surlignage" onClick={() => exec('hiliteColor', '#ffff00')}>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#ffff00', padding: '0 3px', borderRadius: 2 }}>A</span>
      </ToolbarBtn>
      <ToolbarBtn title="Couleur texte" onClick={() => {
        const color = prompt('Couleur hex (ex: #ff0000)', '#000000')
        if (color) exec('foreColor', color)
      }}>
        <span style={{ fontWeight: 900, fontSize: 13, borderBottom: '3px solid #e53e3e' }}>A</span>
      </ToolbarBtn>
      {divider}
      <ToolbarBtn title="Aligner à gauche"  onClick={() => exec('justifyLeft')}>
        <span style={{ fontSize: 11 }}>≡◀</span>
      </ToolbarBtn>
      <ToolbarBtn title="Centrer"           onClick={() => exec('justifyCenter')}>
        <span style={{ fontSize: 11 }}>≡</span>
      </ToolbarBtn>
      <ToolbarBtn title="Aligner à droite"  onClick={() => exec('justifyRight')}>
        <span style={{ fontSize: 11 }}>▶≡</span>
      </ToolbarBtn>
      <ToolbarBtn title="Justifier"         onClick={() => exec('justifyFull')}>
        <span style={{ fontSize: 11 }}>☰</span>
      </ToolbarBtn>
      {divider}
      <ToolbarBtn title="Liste à puces"     onClick={() => exec('insertUnorderedList')}>•</ToolbarBtn>
      <ToolbarBtn title="Liste numérotée"   onClick={() => exec('insertOrderedList')}>1.</ToolbarBtn>
      {divider}
      <ToolbarBtn title="Insérer lien"      onClick={() => {
        const url = prompt('URL du lien', 'https://')
        if (url) exec('createLink', url)
      }}>🔗</ToolbarBtn>
      <ToolbarBtn title="Effacer format"    onClick={() => exec('removeFormat')}>✕</ToolbarBtn>
    </div>
  )
}

// ── Modal ajout variable ───────────────────────────────────────────────────
function AddVariableModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ variable_name: '', label: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async () => {
    if (!form.variable_name.trim() || !form.label.trim()) {
      setErr('Tous les champs sont obligatoires.')
      return
    }
    if (!/^[a-z0-9_]+$/.test(form.variable_name)) {
      setErr('Nom de variable : minuscules, chiffres et _ uniquement.')
      return
    }
    setSaving(true)
    try {
      const res = await formulaireApi.ajouterVariable(form)
      onSaved(res.data)
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur lors de l\'ajout.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: C.white, borderRadius: 12, padding: 28, width: 420,
        boxShadow: shadows.xl,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.navy }}>Nouvelle variable</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.muted }}>×</button>
        </div>

        {err && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#dc2626' }}>
            {err}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase' }}>
            Nom de la variable <span style={{ color: '#dc2626' }}>*</span>
          </div>
          <input
            value={form.variable_name}
            onChange={e => setForm(f => ({ ...f, variable_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
            placeholder="ex: nom_du_medecin"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 12px',
              border: `1.5px solid ${C.border}`, borderRadius: 7,
              fontSize: 13, fontFamily: 'monospace', letterSpacing: 0.5,
            }}
          />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            Sera inséré sous la forme : <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{'{{' + (form.variable_name || 'nom_variable') + '}}'}</code>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: 'uppercase' }}>
            Libellé affiché <span style={{ color: '#dc2626' }}>*</span>
          </div>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="ex: Nom du médecin"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 12px',
              border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="orange" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Ajouter'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────
export default function FormulairePage() {
  // État global
  const [templates, setTemplates]       = useState([])
  const [variables, setVariables]       = useState([])
  const [selected, setSelected]         = useState(null)  // template sélectionné
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [showAddVar, setShowAddVar]     = useState(false)

  // Formulaire édition
  const [form, setForm] = useState({ description: '', header: '', content: '' })
  const [dirty, setDirty] = useState(false)

  const editorRef  = useRef(null)
  const dragVar    = useRef(null)        // variable en cours de glissement
  const savedRange = useRef(null)        // sélection sauvegardée avant dragover
  const [isDragOver, setIsDragOver] = useState(false)

  // ── Chargement initial ──────────────────────────────────────
  useEffect(() => {
    Promise.all([
      formulaireApi.liste(),
      formulaireApi.variables(),
    ]).then(([tRes, vRes]) => {
      setTemplates(tRes.data)
      setVariables(vRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── Synchroniser éditeur avec form.content ─────────────────
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== form.content) {
      editorRef.current.innerHTML = form.content || ''
    }
  }, [form.content])

  // ── Sélectionner un template ────────────────────────────────
  const selectTemplate = (t) => {
    setSelected(t)
    setForm({ description: t.description, header: t.header || '', content: t.content || '' })
    setDirty(false)
  }

  // ── Nouveau template ────────────────────────────────────────
  const handleNew = () => {
    setSelected(null)
    setForm({ description: '', header: '', content: '' })
    if (editorRef.current) editorRef.current.innerHTML = ''
    setDirty(false)
  }

  // ── Lire le contenu de l'éditeur ────────────────────────────
  const getEditorContent = () => editorRef.current?.innerHTML || ''

  // ── Sauvegarder ─────────────────────────────────────────────
  const handleSave = useCallback(async (andClose = false) => {
    const content = getEditorContent()
    if (!form.description.trim()) {
      alert('La description du modèle est obligatoire.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, content }
      if (selected) {
        const res = await formulaireApi.modifier(selected.id, payload)
        setTemplates(ts => ts.map(t => t.id === selected.id ? res.data : t))
        setSelected(res.data)
      } else {
        const res = await formulaireApi.creer(payload)
        setTemplates(ts => [res.data, ...ts])
        setSelected(res.data)
      }
      setDirty(false)
      if (andClose) handleNew()
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }, [form, selected])

  // ── Supprimer template ───────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm(`Supprimer le modèle "${selected.description}" ?`)) return
    await formulaireApi.supprimer(selected.id)
    setTemplates(ts => ts.filter(t => t.id !== selected.id))
    handleNew()
  }

  // ── HTML d'une variable ──────────────────────────────────────
  const varHTML = (varName) =>
    `<span contenteditable="false" style="display:inline-flex;align-items:center;gap:3px;background:#dbeafe;color:#1d4ed8;padding:2px 7px;border-radius:5px;font-weight:700;font-size:12px;border:1px solid #93c5fd;user-select:none;cursor:default">` +
    `<span style="font-size:10px;opacity:0.7">{}</span>{{${varName}}}</span>`

  // ── Insérer à la position du curseur (clic) ──────────────────
  const insertVariable = (varName) => {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, varHTML(varName) + '&nbsp;')
    setDirty(true)
  }

  // ── Insérer à la position du drop ───────────────────────────
  const insertVariableAtPoint = (x, y, varName) => {
    let range = null
    // Chrome / Safari
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y)
    // Firefox
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y)
      if (pos) {
        range = document.createRange()
        range.setStart(pos.offsetNode, pos.offset)
        range.collapse(true)
      }
    }
    if (range) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, varHTML(varName) + '&nbsp;')
    setDirty(true)
  }

  // ── Drag handlers (variables → éditeur) ─────────────────────
  const onVarDragStart = (e, varName) => {
    dragVar.current = varName
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', `{{${varName}}}`)
    // Créer un ghost drag visuellement propre
    const ghost = document.createElement('span')
    ghost.textContent = `{{${varName}}}`
    ghost.style.cssText = 'background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:5px;font-weight:700;font-size:12px;font-family:system-ui;border:1px solid #93c5fd;position:fixed;top:-100px;left:-100px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 12)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const onEditorDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const onEditorDragLeave = (e) => {
    if (!editorRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const onEditorDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const varName = dragVar.current
    if (!varName) return
    insertVariableAtPoint(e.clientX, e.clientY, varName)
    dragVar.current = null
  }

  // ── Supprimer variable ───────────────────────────────────────
  const deleteVariable = async (v) => {
    if (!window.confirm(`Supprimer la variable {{${v.variable_name}}} ?`)) return
    await formulaireApi.supprimerVariable(v.id)
    setVariables(vs => vs.filter(x => x.id !== v.id))
  }

  // ── Filtrer templates ────────────────────────────────────────
  const filtered = templates.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  // ── Rendu ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: C.navy, fontWeight: 700 }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Barre supérieure ── */}
      <div style={{
        background: C.navy, padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md, flexShrink: 0,
      }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: 0.3 }}>
          Gestion Des Modèles de Documents
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" onClick={handleNew}
            style={{ border: '1px solid rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(255,255,255,0.1)' }}>
            + Nouveau
          </Btn>
          <Btn variant="ghost" onClick={() => handleSave(false)} disabled={saving || !dirty}
            style={{ border: '1px solid rgba(255,255,255,0.4)', color: '#fff', background: dirty ? 'rgba(255,118,49,0.7)' : 'rgba(255,255,255,0.08)' }}>
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </Btn>
          {selected && (
            <Btn variant="ghost" onClick={handleDelete}
              style={{ border: '1px solid rgba(220,38,38,0.5)', color: '#fca5a5', background: 'rgba(220,38,38,0.12)' }}>
              Supprimer
            </Btn>
          )}
        </div>
      </div>

      {/* ── Corps 3 colonnes ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 12, gap: 12 }}>

        {/* ── Colonne gauche : liste des templates ── */}
        <div style={{
          width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: C.white, borderRadius: 10, border: `1px solid ${C.border}`,
          boxShadow: shadows.sm, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 12px', borderBottom: `1px solid ${C.border}`,
            background: '#f8fafc',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Modèles de Document
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.muted }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                style={{
                  width: '100%', boxSizing: 'border-box', paddingLeft: 28, paddingRight: 8,
                  height: 30, border: `1px solid ${C.border}`, borderRadius: 6,
                  fontSize: 12, background: C.white,
                }}
              />
            </div>
          </div>

          {/* En-tête colonne */}
          <div style={{
            padding: '8px 14px', background: C.navy,
            fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center',
          }}>
            Modèles de Document
          </div>

          {/* Liste scrollable */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: 12 }}>
                Aucun modèle trouvé
              </div>
            ) : (
              filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                    borderBottom: `1px solid #f0f4f8`,
                    background: selected?.id === t.id ? '#fff0e6' : C.white,
                    color: selected?.id === t.id ? C.orange : C.text,
                    fontWeight: selected?.id === t.id ? 700 : 400,
                    borderLeft: selected?.id === t.id ? `3px solid ${C.orange}` : '3px solid transparent',
                    transition: 'all 0.12s',
                  }}
                >
                  {t.description}
                </div>
              ))
            )}
            {/* Lignes vides padding visuel */}
            {Array.from({ length: Math.max(0, 8 - filtered.length) }).map((_, i) => (
              <div key={`emp-${i}`} style={{ padding: '10px 14px', borderBottom: `1px solid #f0f4f8`, height: 38 }} />
            ))}
          </div>
        </div>

        {/* ── Colonne centre : éditeur ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
          background: C.white, borderRadius: 10, border: `1px solid ${C.border}`,
          boxShadow: shadows.sm, overflow: 'hidden',
        }}>

          {/* En-tête formulaire */}
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
            background: '#f8fafc',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Modèles de Document
              {dirty && <span style={{ marginLeft: 8, color: C.orange, fontSize: 10 }}>● Non sauvegardé</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              {/* ID auto */}
              <div style={{ minWidth: 100 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Identifiant du modèle</div>
                <input
                  readOnly value={selected?.id || ''}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 10px',
                    border: `1px solid ${C.border}`, borderRadius: 6,
                    fontSize: 12, background: '#f1f5f9', color: C.muted,
                  }}
                />
              </div>
              {/* Description */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>
                  * Description
                </div>
                <input
                  value={form.description}
                  onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setDirty(true) }}
                  placeholder="Nom du modèle de document"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 10px',
                    border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 13,
                  }}
                />
              </div>
              {/* En-tête */}
              <div style={{ flex: 1.5 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>
                  * En-tête de document
                </div>
                <input
                  value={form.header}
                  onChange={e => { setForm(f => ({ ...f, header: e.target.value })); setDirty(true) }}
                  placeholder="Titre imprimé sur le document"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 10px',
                    border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Toolbar WYSIWYG */}
          <WysiwygToolbar editorRef={editorRef} />

          {/* Zone édition */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setDirty(true)}
            onDragOver={onEditorDragOver}
            onDragLeave={onEditorDragLeave}
            onDrop={onEditorDrop}
            style={{
              flex: 1, padding: '16px 20px', overflowY: 'auto',
              outline: 'none', fontSize: 13, lineHeight: 1.7,
              color: C.text, fontFamily: 'Times New Roman, serif',
              minHeight: 200,
              transition: 'box-shadow 0.15s, background 0.15s',
              ...(isDragOver ? {
                background: '#eff6ff',
                boxShadow: 'inset 0 0 0 2px #3b82f6',
              } : {}),
            }}
          />

          {/* Pied info */}
          <div style={{
            padding: '5px 14px', borderTop: `1px solid ${C.border}`,
            background: '#f8fafc', fontSize: 11, color: C.muted,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span>⇠ Glissez une variable ou cliquez dessus pour l'insérer à la position du curseur</span>
            <span>|</span>
            <span>Format : <code style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0 4px', borderRadius: 3 }}>{'{{nom_variable}}'}</code></span>
          </div>
        </div>

        {/* ── Colonne droite : variables ── */}
        <div style={{
          width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: C.white, borderRadius: 10, border: `1px solid ${C.border}`,
          boxShadow: shadows.sm, overflow: 'hidden',
        }}>
          {/* En-tête */}
          <div style={{
            padding: '8px 14px', background: C.navy,
            fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center',
          }}>
            Liste des variables
          </div>

          {/* Bouton ajouter */}
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, background: '#f8fafc' }}>
            <button
              onClick={() => setShowAddVar(true)}
              style={{
                width: '100%', padding: '6px 0', border: `1.5px dashed ${C.orange}`,
                borderRadius: 6, background: '#fff8f5', color: C.orange,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              + Ajouter une variable
            </button>
          </div>

          {/* Liste scrollable */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {variables.map(v => (
              <div
                key={v.id}
                draggable
                onDragStart={e => onVarDragStart(e, v.variable_name)}
                onClick={() => insertVariable(v.variable_name)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderBottom: `1px solid #f0f4f8`,
                  cursor: 'grab', userSelect: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.rowHov}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                title={`Glisser ou cliquer pour insérer {{${v.variable_name}}}`}
              >
                {/* Poignée de drag */}
                <span style={{
                  fontSize: 11, color: '#cbd5e1', marginRight: 6, flexShrink: 0,
                  lineHeight: 1, letterSpacing: -1,
                }}>⠿</span>

                <span style={{
                  flex: 1, fontSize: 12,
                  color: v.is_system ? C.system : C.text,
                  fontWeight: v.is_system ? 600 : 400,
                  wordBreak: 'break-word',
                }}>
                  {v.label}
                </span>

                {/* Badge système ou bouton supprimer */}
                {v.is_system ? (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: '#6366f1',
                    background: '#eef2ff', border: '1px solid #c7d2fe',
                    borderRadius: 3, padding: '1px 4px', flexShrink: 0, marginLeft: 4,
                  }}>SYS</span>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); deleteVariable(v) }}
                    title="Supprimer"
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: '#dc2626', fontSize: 14, padding: '0 4px', flexShrink: 0,
                      opacity: 0.55, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Légende */}
          <div style={{
            padding: '6px 10px', borderTop: `1px solid ${C.border}`,
            background: '#f8fafc', fontSize: 10, color: C.muted,
          }}>
            <span style={{ color: C.system, fontWeight: 600 }}>■</span> Variables système &nbsp;
            <span style={{ color: C.text }}>■</span> Variables personnalisées
          </div>
        </div>

      </div>

      {/* ── Modal ajout variable ── */}
      {showAddVar && (
        <AddVariableModal
          onClose={() => setShowAddVar(false)}
          onSaved={v => setVariables(vs => [...vs, v])}
        />
      )}
    </div>
  )
}
