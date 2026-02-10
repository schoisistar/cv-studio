import React, { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import mammoth from 'mammoth'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?url'

GlobalWorkerOptions.workerSrc = pdfWorker

const STORAGE_KEYS = {
  resume: 'cvtool.resume.v1',
  template: 'cvtool.template.v1',
  jobField: 'cvtool.jobField.v1',
  sourceText: 'cvtool.sourceText.v1',
  uploads: 'cvtool.uploads.v1'
}

const JOB_FIELDS = [
  'General',
  'Software Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'Healthcare',
  'Operations',
  'Academia'
]

const FIELD_GUIDANCE = {
  General: {
    must: ['Summary', 'Experience', 'Skills'],
    good: ['Projects', 'Education', 'Certifications']
  },
  'Software Engineering': {
    must: ['Skills', 'Projects', 'Experience'],
    good: ['Certifications', 'Open Source', 'Education']
  },
  Design: {
    must: ['Portfolio Link', 'Projects', 'Experience'],
    good: ['Awards', 'Tools', 'Education']
  },
  Marketing: {
    must: ['Experience', 'Metrics', 'Campaigns'],
    good: ['Certifications', 'Tools', 'Projects']
  },
  Sales: {
    must: ['Experience', 'Quota Attainment', 'Metrics'],
    good: ['Territories', 'Tools', 'Certifications']
  },
  Finance: {
    must: ['Experience', 'Certifications', 'Education'],
    good: ['Projects', 'Technical Skills']
  },
  Healthcare: {
    must: ['Licenses', 'Experience', 'Education'],
    good: ['Certifications', 'Specializations']
  },
  Operations: {
    must: ['Experience', 'Process Improvements', 'Metrics'],
    good: ['Tools', 'Certifications']
  },
  Academia: {
    must: ['Education', 'Publications', 'Research'],
    good: ['Teaching', 'Grants', 'Awards']
  }
}

const TEMPLATE_OPTIONS = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Two-column executive look',
    vars: {
      accent: '#1f4d7a',
      paper: '#fdf9f3',
      sidebar: '#f2e7d9',
      bodyFont: '"Work Sans", sans-serif',
      displayFont: '"Playfair Display", serif'
    },
    layout: 'two-left'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold header and clean grid',
    vars: {
      accent: '#0f4c5c',
      paper: '#f5f8fa',
      sidebar: '#e8f1f4',
      bodyFont: '"Space Grotesk", sans-serif',
      displayFont: '"Space Grotesk", sans-serif'
    },
    layout: 'two-left'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Monochrome with sharp typography',
    vars: {
      accent: '#2d2d2d',
      paper: '#ffffff',
      sidebar: '#f4f4f4',
      bodyFont: '"IBM Plex Sans", sans-serif',
      displayFont: '"IBM Plex Serif", serif'
    },
    layout: 'two-left'
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Warm editorial with artisan tone',
    vars: {
      accent: '#7c3f1d',
      paper: '#fff6ed',
      sidebar: '#f7e4d4',
      bodyFont: '"Sora", sans-serif',
      displayFont: '"Cormorant Garamond", serif'
    },
    layout: 'two-left'
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Crisp corporate balance',
    vars: {
      accent: '#2f3b4f',
      paper: '#f4f6f8',
      sidebar: '#e6eaf0',
      bodyFont: '"IBM Plex Sans", sans-serif',
      displayFont: '"Space Grotesk", sans-serif'
    },
    layout: 'two-left'
  },
  {
    id: 'coast',
    name: 'Coast',
    description: 'Fresh, light, and calm',
    vars: {
      accent: '#0b7285',
      paper: '#f0f7f9',
      sidebar: '#d9edf2',
      bodyFont: '"Work Sans", sans-serif',
      displayFont: '"Playfair Display", serif'
    },
    layout: 'two-left'
  },
  {
    id: 'reverse',
    name: 'Reverse',
    description: 'Right sidebar for detail-first roles',
    vars: {
      accent: '#2a4d69',
      paper: '#f7f8fb',
      sidebar: '#e4e9f2',
      bodyFont: '"Space Grotesk", sans-serif',
      displayFont: '"Space Grotesk", sans-serif'
    },
    layout: 'two-right'
  },
  {
    id: 'actor',
    name: 'Actor',
    description: 'Single-column, audition ready',
    vars: {
      accent: '#3a3a3a',
      paper: '#ffffff',
      sidebar: '#f4f4f4',
      bodyFont: '"Work Sans", sans-serif',
      displayFont: '"Cormorant Garamond", serif'
    },
    layout: 'single'
  }
]

const TEMPLATE_SAMPLE = {
  name: 'Alex Morgan',
  role: 'Product Designer'
}

function createEmptyResume() {
  return {
    contact: {
      fullName: '',
      role: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    skills: [''],
    experiences: [
      {
        id: makeId(),
        role: '',
        company: '',
        location: '',
        start: '',
        end: '',
        bullets: ['']
      }
    ],
    education: [
      {
        id: makeId(),
        school: '',
        degree: '',
        location: '',
        start: '',
        end: '',
        details: ['']
      }
    ],
    projects: [
      {
        id: makeId(),
        name: '',
        link: '',
        description: '',
        bullets: ['']
      }
    ],
    certifications: [
      {
        id: makeId(),
        name: '',
        issuer: '',
        year: ''
      }
    ],
    languages: [
      {
        id: makeId(),
        name: '',
        level: ''
      }
    ],
    customSections: [],
    imageDataUrl: ''
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage errors
    }
  }, [key, value])

  return [value, setValue]
}

function sanitizeUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function extractSentences(text, limit = 3) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const matches = normalized.match(/[^.!?]+[.!?]+/g) || normalized.split(/\n+/)
  const sentences = matches.map((s) => s.trim()).filter((s) => s.length > 40)
  return sentences.slice(0, limit)
}

function improveLine(line) {
  if (!line) return ''
  const trimmed = line.trim()
  if (!trimmed) return ''
  const starters = ['Delivered', 'Led', 'Built', 'Optimized', 'Launched', 'Improved']
  const pick = starters[Math.floor(Math.random() * starters.length)]
  const normalized = trimmed.replace(/^[-•]\s*/, '')
  if (/\b\d+\b/.test(normalized)) {
    return `${pick} ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`
  }
  return `${pick} ${normalized}${normalized.endsWith('.') ? '' : '.'}`
}

function improveSummary(summary) {
  if (!summary) return ''
  const cleaned = summary.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 80) {
    return `${cleaned} Known for cross-functional collaboration and measurable impact.`
  }
  return cleaned
}

function parseSkills(text) {
  const skillSectionMatch = text.match(/skills?\s*[:\n]([\s\S]{0,400})/i)
  if (skillSectionMatch) {
    const lines = skillSectionMatch[1]
      .split(/\n|,|•/)
      .map((l) => l.trim())
      .filter((l) => l.length > 1)
    return Array.from(new Set(lines)).slice(0, 12)
  }
  const candidates = text
    .split(/,|\n/)
    .map((l) => l.trim())
    .filter((l) => /^[A-Za-z][A-Za-z +#.-]{1,30}$/.test(l))
  return Array.from(new Set(candidates)).slice(0, 8)
}

function parseSection(text, labels) {
  const lower = text.toLowerCase()
  let startIndex = -1
  let matchedLabel = ''
  for (const label of labels) {
    const idx = lower.indexOf(label)
    if (idx !== -1 && (startIndex === -1 || idx < startIndex)) {
      startIndex = idx
      matchedLabel = label
    }
  }
  if (startIndex === -1) return ''
  const after = text.slice(startIndex + matchedLabel.length)
  const nextLabelMatch = after.match(/\n\s*[A-Z][A-Za-z ]{3,20}\s*\n/)
  if (nextLabelMatch) {
    const nextIndex = nextLabelMatch.index
    return after.slice(0, nextIndex).trim()
  }
  return after.trim()
}

function buildExperienceFromText(text) {
  const section = parseSection(text, ['experience', 'work experience', 'employment'])
  if (!section) return []
  const lines = section
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  const entries = []
  for (const line of lines) {
    if (entries.length >= 3) break
    if (line.length < 6) continue
    let role = ''
    let company = ''
    if (line.includes(' at ')) {
      const [left, right] = line.split(' at ')
      role = left.trim()
      company = right.trim()
    } else if (line.includes(' - ')) {
      const [left, right] = line.split(' - ')
      company = left.trim()
      role = right.trim()
    } else {
      role = line
      company = ''
    }
    entries.push({
      id: makeId(),
      role,
      company,
      location: '',
      start: '',
      end: '',
      bullets: extractSentences(section, 3).map(improveLine)
    })
  }
  return entries
}

function buildEducationFromText(text) {
  const section = parseSection(text, ['education'])
  if (!section) return []
  const lines = section
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return []
  return [
    {
      id: makeId(),
      school: lines[0] || '',
      degree: lines[1] || '',
      location: '',
      start: '',
      end: '',
      details: lines.slice(2, 4).map(improveLine)
    }
  ]
}

function mergeResume(base, updates) {
  return {
    ...base,
    ...updates,
    contact: {
      ...base.contact,
      ...(updates.contact || {})
    }
  }
}

function prefillFromText(resume, text) {
  if (!text) return resume
  const updated = { ...resume }
  if (!resume.summary || resume.summary.length < 50) {
    const sentences = extractSentences(text, 2)
    updated.summary = sentences.join(' ')
  }
  if (!resume.skills || resume.skills.length === 0 || resume.skills.every((s) => !s)) {
    const skills = parseSkills(text)
    updated.skills = skills.length ? skills : resume.skills
  }
  if (resume.experiences.length === 0 || !resume.experiences[0].role) {
    const exp = buildExperienceFromText(text)
    if (exp.length) updated.experiences = exp
  }
  if (resume.education.length === 0 || !resume.education[0].school) {
    const edu = buildEducationFromText(text)
    if (edu.length) updated.education = edu
  }
  return updated
}

function improveResume(resume) {
  const improved = { ...resume }
  improved.summary = improveSummary(resume.summary)
  improved.skills = resume.skills.map((s) => s.trim()).filter(Boolean)
  improved.experiences = resume.experiences.map((exp) => ({
    ...exp,
    bullets: exp.bullets.map(improveLine)
  }))
  improved.projects = resume.projects.map((proj) => ({
    ...proj,
    bullets: proj.bullets.map(improveLine)
  }))
  return improved
}

function TemplateThumbnail({ template }) {
  const layout = template.layout || 'two-left'
  const isSingle = layout === 'single'
  const style = {
    '--accent': template.vars.accent,
    '--paper': template.vars.paper,
    '--sidebar': template.vars.sidebar,
    '--font-body': template.vars.bodyFont,
    '--font-display': template.vars.displayFont
  }

  return (
    <div className={`template-preview real layout-${layout}`} style={style}>
      <div className="thumb-page">
        {!isSingle && (
          <div className="thumb-sidebar">
            <div className="thumb-photo" />
            <div className="thumb-block">
              <span className="thumb-label">Contact</span>
              <span className="thumb-line" />
              <span className="thumb-line short" />
            </div>
            <div className="thumb-block">
              <span className="thumb-label">Skills</span>
              <span className="thumb-line short" />
              <span className="thumb-line" />
              <span className="thumb-line short" />
            </div>
          </div>
        )}
        <div className="thumb-main">
          <div className={`thumb-header ${isSingle ? 'single' : ''}`}>
            {isSingle && <div className="thumb-photo single" />}
            <div className="thumb-name">{TEMPLATE_SAMPLE.name}</div>
            <div className="thumb-role">{TEMPLATE_SAMPLE.role}</div>
            {isSingle && (
              <div className="thumb-contact">
                <span className="thumb-line" />
                <span className="thumb-line short" />
              </div>
            )}
          </div>
          <div className="thumb-section">
            <span className="thumb-label">Summary</span>
            <span className="thumb-line wide" />
            <span className="thumb-line" />
          </div>
          <div className="thumb-section">
            <span className="thumb-label">Experience</span>
            <span className="thumb-line wide" />
            <span className="thumb-line" />
            <span className="thumb-line short" />
          </div>
        </div>
      </div>
    </div>
  )
}

async function extractTextFromFile(file) {
  if (!file) return ''
  const ext = file.name.split('.').pop().toLowerCase()
  if (file.type === 'text/plain' || ext === 'txt') {
    return await file.text()
  }
  if (file.type === 'application/pdf' || ext === 'pdf') {
    const buffer = await file.arrayBuffer()
    const pdf = await getDocument({ data: buffer }).promise
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const strings = content.items.map((item) => item.str)
      fullText += `${strings.join(' ')}\n`
    }
    return fullText
  }
  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value
  }
  return ''
}

function parseDate(value) {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'present' || normalized === 'current') return new Date()
  const monthMatch = normalized.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})$/i)
  if (monthMatch) {
    const monthIndex =
      ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(
        monthMatch[1].toLowerCase()
      )
    return new Date(Number(monthMatch[2]), monthIndex, 1)
  }
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})$/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, 1)
  }
  const yearMatch = normalized.match(/^(\d{4})$/)
  if (yearMatch) {
    return new Date(Number(yearMatch[1]), 0, 1)
  }
  return null
}

function getRedFlags(resume, jobField) {
  const flags = []
  if (!resume.contact.fullName) flags.push('Missing full name in the header.')
  if (!resume.contact.email && !resume.contact.phone) flags.push('Add at least one direct contact method (email or phone).')
  if (!resume.summary || resume.summary.length < 60) flags.push('Summary is short. Add scope, domain, and impact in 2-3 lines.')
  const allBullets = resume.experiences.flatMap((exp) => exp.bullets).filter(Boolean)
  if (!allBullets.some((b) => /\d+/.test(b))) {
    flags.push('No metrics detected. Add quantified impact in experience bullets.')
  }
  const experiencesWithDates = resume.experiences
    .map((exp) => ({
      start: parseDate(exp.start),
      end: parseDate(exp.end)
    }))
    .filter((exp) => exp.start)
  if (experiencesWithDates.length > 1) {
    const sorted = experiencesWithDates.sort((a, b) => a.start - b.start)
    for (let i = 1; i < sorted.length; i += 1) {
      if (!sorted[i - 1].end || !sorted[i].start) continue
      const gapMonths = (sorted[i].start - sorted[i - 1].end) / (1000 * 60 * 60 * 24 * 30)
      if (gapMonths > 6) {
        flags.push('Detected a gap longer than 6 months between roles. Consider adding explanation or projects.')
        break
      }
    }
  }
  const guidance = FIELD_GUIDANCE[jobField]
  if (guidance) {
    for (const section of guidance.must) {
      if (section === 'Skills' && (!resume.skills || resume.skills.every((s) => !s))) {
        flags.push(`${jobField} roles typically need a strong Skills section.`)
      }
      if (section === 'Projects' && resume.projects.every((p) => !p.name)) {
        flags.push(`${jobField} roles often expect Projects or Portfolio highlights.`)
      }
      if (section === 'Education' && resume.education.every((e) => !e.school)) {
        flags.push(`${jobField} roles usually require Education details.`)
      }
    }
  }
  return flags
}

export default function App() {
  const [resume, setResume] = useLocalStorage(STORAGE_KEYS.resume, createEmptyResume())
  const [templateId, setTemplateId] = useLocalStorage(STORAGE_KEYS.template, 'classic')
  const [jobField, setJobField] = useLocalStorage(STORAGE_KEYS.jobField, 'General')
  const [sourceText, setSourceText] = useLocalStorage(STORAGE_KEYS.sourceText, '')
  const [uploads, setUploads] = useLocalStorage(STORAGE_KEYS.uploads, {
    cv: null,
    supporting: []
  })
  const [status, setStatus] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const previewRef = useRef(null)
  const sectionRefs = useRef({})
  const highlightTimer = useRef(null)

  const template = TEMPLATE_OPTIONS.find((opt) => opt.id === templateId) || TEMPLATE_OPTIONS[0]
  const layoutClass = `layout-${template.layout || 'two-left'}`
  const isSingleLayout = template.layout === 'single'

  const redFlags = useMemo(() => getRedFlags(resume, jobField), [resume, jobField])

  const focusSection = (key) => {
    const target = sectionRefs.current[key]
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(key)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setActiveSection(''), 1400)
  }

  const sectionClickProps = (key) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => focusSection(key),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        focusSection(key)
      }
    }
  })

  const handleLinkedIn = (value) => {
    setResume((prev) => mergeResume(prev, { contact: { linkedin: value } }))
  }

  const handleContactChange = (field, value) => {
    setResume((prev) => mergeResume(prev, { contact: { [field]: value } }))
  }

  const handleSummaryChange = (value) => {
    setResume((prev) => ({ ...prev, summary: value }))
  }

  const handleSkillsChange = (index, value) => {
    setResume((prev) => {
      const skills = [...prev.skills]
      skills[index] = value
      return { ...prev, skills }
    })
  }

  const addSkill = () => {
    setResume((prev) => ({ ...prev, skills: [...prev.skills, ''] }))
  }

  const removeSkill = (index) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const updateExperience = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const updateExperienceBullet = (id, index, value) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id
          ? { ...exp, bullets: exp.bullets.map((b, i) => (i === index ? value : b)) }
          : exp
      )
    }))
  }

  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: makeId(),
          role: '',
          company: '',
          location: '',
          start: '',
          end: '',
          bullets: ['']
        }
      ]
    }))
  }

  const removeExperience = (id) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id)
    }))
  }

  const addExperienceBullet = (id) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, bullets: [...exp.bullets, ''] } : exp
      )
    }))
  }

  const removeExperienceBullet = (id, index) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id
          ? { ...exp, bullets: exp.bullets.filter((_, i) => i !== index) }
          : exp
      )
    }))
  }

  const updateEducation = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const updateEducationDetail = (id, index, value) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id
          ? { ...edu, details: edu.details.map((d, i) => (i === index ? value : d)) }
          : edu
      )
    }))
  }

  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: makeId(),
          school: '',
          degree: '',
          location: '',
          start: '',
          end: '',
          details: ['']
        }
      ]
    }))
  }

  const removeEducation = (id) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id)
    }))
  }

  const addEducationDetail = (id) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, details: [...edu.details, ''] } : edu
      )
    }))
  }

  const removeEducationDetail = (id, index) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id
          ? { ...edu, details: edu.details.filter((_, i) => i !== index) }
          : edu
      )
    }))
  }

  const updateProject = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }))
  }

  const updateProjectBullet = (id, index, value) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id
          ? { ...proj, bullets: proj.bullets.map((b, i) => (i === index ? value : b)) }
          : proj
      )
    }))
  }

  const addProject = () => {
    setResume((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { id: makeId(), name: '', link: '', description: '', bullets: [''] }
      ]
    }))
  }

  const removeProject = (id) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id)
    }))
  }

  const addProjectBullet = (id) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, bullets: [...proj.bullets, ''] } : proj
      )
    }))
  }

  const removeProjectBullet = (id, index) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id
          ? { ...proj, bullets: proj.bullets.filter((_, i) => i !== index) }
          : proj
      )
    }))
  }

  const updateCertification = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }))
  }

  const addCertification = () => {
    setResume((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { id: makeId(), name: '', issuer: '', year: '' }
      ]
    }))
  }

  const removeCertification = (id) => {
    setResume((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id)
    }))
  }

  const updateLanguage = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      languages: prev.languages.map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    }))
  }

  const addLanguage = () => {
    setResume((prev) => ({
      ...prev,
      languages: [...prev.languages, { id: makeId(), name: '', level: '' }]
    }))
  }

  const removeLanguage = (id) => {
    setResume((prev) => ({
      ...prev,
      languages: prev.languages.filter((lang) => lang.id !== id)
    }))
  }

  const addCustomSection = () => {
    setResume((prev) => ({
      ...prev,
      customSections: [
        ...prev.customSections,
        { id: makeId(), title: 'Custom Section', items: [''] }
      ]
    }))
  }

  const updateCustomSectionTitle = (id, value) => {
    setResume((prev) => ({
      ...prev,
      customSections: prev.customSections.map((sec) =>
        sec.id === id ? { ...sec, title: value } : sec
      )
    }))
  }

  const updateCustomSectionItem = (id, index, value) => {
    setResume((prev) => ({
      ...prev,
      customSections: prev.customSections.map((sec) =>
        sec.id === id
          ? { ...sec, items: sec.items.map((item, i) => (i === index ? value : item)) }
          : sec
      )
    }))
  }

  const addCustomSectionItem = (id) => {
    setResume((prev) => ({
      ...prev,
      customSections: prev.customSections.map((sec) =>
        sec.id === id ? { ...sec, items: [...sec.items, ''] } : sec
      )
    }))
  }

  const removeCustomSectionItem = (id, index) => {
    setResume((prev) => ({
      ...prev,
      customSections: prev.customSections.map((sec) =>
        sec.id === id
          ? { ...sec, items: sec.items.filter((_, i) => i !== index) }
          : sec
      )
    }))
  }

  const removeCustomSection = (id) => {
    setResume((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((sec) => sec.id !== id)
    }))
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setResume((prev) => ({ ...prev, imageDataUrl: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleCvUpload = async (file) => {
    if (!file) return
    try {
      setStatus('Parsing CV...')
      const text = await extractTextFromFile(file)
      setSourceText(text)
      setUploads((prev) => ({ ...prev, cv: { name: file.name, type: file.type } }))
      setResume((prev) => prefillFromText(prev, text))
      setStatus('CV parsed. Content prefilled where possible.')
    } catch (error) {
      setStatus('Unable to parse that CV file. Try a TXT export.')
    }
  }

  const handleSupportingUpload = async (files) => {
    if (!files || files.length === 0) return
    try {
      setStatus('Parsing supporting documents...')
      let combined = sourceText
      const metadata = []
      for (const file of files) {
        const text = await extractTextFromFile(file)
        combined += `\n${text}`
        metadata.push({ name: file.name, type: file.type })
      }
      setSourceText(combined)
      setUploads((prev) => ({
        ...prev,
        supporting: [...(prev.supporting || []), ...metadata]
      }))
      setResume((prev) => prefillFromText(prev, combined))
      setStatus('Supporting documents parsed. Updated suggestions applied.')
    } catch (error) {
      setStatus('Unable to parse one or more supporting files. Try TXT exports.')
    }
  }

  const handleImprove = () => {
    setResume((prev) => improveResume(prev))
    setStatus('Stub AI improvement applied. Review the tone and metrics.')
  }

  const handleDownload = async () => {
    if (!previewRef.current) return
    setIsGenerating(true)
    setStatus('Generating PDF...')
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'pt', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgProps = pdf.getImageProperties(imgData)
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height)
    const width = imgProps.width * ratio
    const height = imgProps.height * ratio
    pdf.addImage(imgData, 'PNG', (pageWidth - width) / 2, 0, width, height)
    pdf.save('cv.pdf')
    setIsGenerating(false)
    setStatus('PDF downloaded.')
  }

  const clearLocalData = () => {
    if (!confirm('This will clear all saved CV data in local storage. Continue?')) return
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    setResume(createEmptyResume())
    setTemplateId('classic')
    setJobField('General')
    setSourceText('')
    setUploads({ cv: null, supporting: [] })
    setStatus('Local data cleared.')
  }

  const templateStyle = {
    '--accent': template.vars.accent,
    '--paper': template.vars.paper,
    '--sidebar': template.vars.sidebar,
    '--font-body': template.vars.bodyFont,
    '--font-display': template.vars.displayFont
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">CV Studio</p>
          <h1>Build a CV that feels ready for recruiters</h1>
          <p className="subhead">
            Upload your CV or docs, pick a template, refine with AI prompts, and
            download a pixel-matched PDF.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={handleImprove}>
            Improve with AI (stub)
          </button>
          <button className="btn primary" onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </header>

      <main className="content">
        <section className="panel left">
          <div className="panel-card">
            <h2>Start with your sources</h2>
            <div className="grid two">
              <label className="field">
                <span>LinkedIn URL</span>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/you"
                  value={resume.contact.linkedin}
                  onChange={(e) => handleLinkedIn(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Job Field</span>
                <select value={jobField} onChange={(e) => setJobField(e.target.value)}>
                  {JOB_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="hint">
              LinkedIn import is stubbed. For now, upload a LinkedIn PDF export or
              paste profile text into a TXT file to prefill content.
            </p>
            <div className="upload-grid">
              <label className="upload-card">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleCvUpload(e.target.files[0])}
                />
                <span>Upload CV</span>
                <small>{uploads.cv ? uploads.cv.name : 'PDF, DOCX, TXT'}</small>
              </label>
              <label className="upload-card">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  multiple
                  onChange={(e) => handleSupportingUpload(Array.from(e.target.files))}
                />
                <span>Supporting Docs</span>
                <small>
                  {uploads.supporting && uploads.supporting.length
                    ? `${uploads.supporting.length} file(s)`
                    : 'Case studies, notes, portfolios'}
                </small>
              </label>
              <label className="upload-card">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                />
                <span>Profile Photo</span>
                <small>{resume.imageDataUrl ? 'Image selected' : 'PNG, JPG'}</small>
              </label>
              <button
                type="button"
                className="ghost"
                onClick={() => setResume((prev) => ({ ...prev, imageDataUrl: '' }))}
              >
                Remove Photo
              </button>
            </div>
            <p className="status">{status}</p>
          </div>

          <div className="panel-card">
            <h2>Template Gallery</h2>
            <div className="template-grid">
              {TEMPLATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  className={`template-card ${opt.id === templateId ? 'active' : ''}`}
                  onClick={() => setTemplateId(opt.id)}
                  type="button"
                >
                  <TemplateThumbnail template={opt} />
                  <div>
                    <strong>{opt.name}</strong>
                    <p>{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <h2>Job Field Guidance</h2>
            <p>
              We adjust what matters based on the role. For{' '}
              <strong>{jobField}</strong>, prioritize:
            </p>
            <div className="chips">
              {FIELD_GUIDANCE[jobField]?.must.map((item) => (
                <span key={item} className="chip primary">
                  {item}
                </span>
              ))}
              {FIELD_GUIDANCE[jobField]?.good.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <h2>Editor</h2>
            <div className="editor">
              <div
                className={`section ${activeSection === 'contact' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.contact = el)}
              >
                <h3>Contact</h3>
                <div className="grid two">
                  <label className="field">
                    <span>Full Name</span>
                    <input
                      value={resume.contact.fullName}
                      onChange={(e) => handleContactChange('fullName', e.target.value)}
                      placeholder="Alex Johnson"
                    />
                  </label>
                  <label className="field">
                    <span>Target Role</span>
                    <input
                      value={resume.contact.role}
                      onChange={(e) => handleContactChange('role', e.target.value)}
                      placeholder="Senior Product Manager"
                    />
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input
                      value={resume.contact.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      placeholder="alex@email.com"
                    />
                  </label>
                  <label className="field">
                    <span>Phone</span>
                    <input
                      value={resume.contact.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      placeholder="+1 555 0123"
                    />
                  </label>
                  <label className="field">
                    <span>Location</span>
                    <input
                      value={resume.contact.location}
                      onChange={(e) => handleContactChange('location', e.target.value)}
                      placeholder="New York, NY"
                    />
                  </label>
                  <label className="field">
                    <span>Website</span>
                    <input
                      value={resume.contact.website}
                      onChange={(e) => handleContactChange('website', e.target.value)}
                      placeholder="portfolio.com"
                    />
                  </label>
                </div>
              </div>

              <div
                className={`section ${activeSection === 'summary' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.summary = el)}
              >
                <h3>Summary</h3>
                <label className="field">
                  <textarea
                    rows="4"
                    value={resume.summary}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    placeholder="Strategic operator with 8+ years..."
                  />
                </label>
              </div>

              <div
                className={`section ${activeSection === 'skills' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.skills = el)}
              >
                <h3>Skills</h3>
                {resume.skills.map((skill, index) => (
                  <div className="inline-row" key={`skill-${index}`}>
                    <input
                      value={skill}
                      onChange={(e) => handleSkillsChange(index, e.target.value)}
                      placeholder="e.g. Product Strategy"
                    />
                    <button className="ghost" onClick={() => removeSkill(index)} type="button">
                      Remove
                    </button>
                  </div>
                ))}
                <button className="ghost" onClick={addSkill} type="button">
                  Add Skill
                </button>
              </div>

              <div
                className={`section ${activeSection === 'experience' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.experience = el)}
              >
                <h3>Experience</h3>
                {resume.experiences.map((exp) => (
                  <div key={exp.id} className="subcard">
                    <div className="grid two">
                      <label className="field">
                        <span>Role</span>
                        <input
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                          placeholder="Head of Growth"
                        />
                      </label>
                      <label className="field">
                        <span>Company</span>
                        <input
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          placeholder="Pulse Labs"
                        />
                      </label>
                      <label className="field">
                        <span>Location</span>
                        <input
                          value={exp.location}
                          onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                          placeholder="Remote"
                        />
                      </label>
                      <label className="field">
                        <span>Start</span>
                        <input
                          value={exp.start}
                          onChange={(e) => updateExperience(exp.id, 'start', e.target.value)}
                          placeholder="2021-03"
                        />
                      </label>
                      <label className="field">
                        <span>End</span>
                        <input
                          value={exp.end}
                          onChange={(e) => updateExperience(exp.id, 'end', e.target.value)}
                          placeholder="Present"
                        />
                      </label>
                    </div>
                    <div className="bullets">
                      {exp.bullets.map((bullet, index) => (
                        <div className="inline-row" key={`${exp.id}-bullet-${index}`}>
                          <input
                            value={bullet}
                            onChange={(e) =>
                              updateExperienceBullet(exp.id, index, e.target.value)
                            }
                            placeholder="Led a 10-person team to..."
                          />
                          <button
                            className="ghost"
                            type="button"
                            onClick={() => removeExperienceBullet(exp.id, index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button className="ghost" onClick={() => addExperienceBullet(exp.id)} type="button">
                        Add Bullet
                      </button>
                    </div>
                    <button className="ghost" onClick={() => removeExperience(exp.id)} type="button">
                      Remove Role
                    </button>
                  </div>
                ))}
                <button className="ghost" onClick={addExperience} type="button">
                  Add Experience
                </button>
              </div>

              <div
                className={`section ${activeSection === 'projects' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.projects = el)}
              >
                <h3>Projects</h3>
                {resume.projects.map((proj) => (
                  <div key={proj.id} className="subcard">
                    <div className="grid two">
                      <label className="field">
                        <span>Name</span>
                        <input
                          value={proj.name}
                          onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                          placeholder="Growth Dashboard"
                        />
                      </label>
                      <label className="field">
                        <span>Link</span>
                        <input
                          value={proj.link}
                          onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                          placeholder="https://..."
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span>Description</span>
                      <input
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                        placeholder="Analytics stack to monitor..."
                      />
                    </label>
                    {proj.bullets.map((bullet, index) => (
                      <div className="inline-row" key={`${proj.id}-bullet-${index}`}>
                        <input
                          value={bullet}
                          onChange={(e) => updateProjectBullet(proj.id, index, e.target.value)}
                          placeholder="Shipped in 6 weeks and cut..."
                        />
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => removeProjectBullet(proj.id, index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button className="ghost" onClick={() => addProjectBullet(proj.id)} type="button">
                      Add Bullet
                    </button>
                    <button className="ghost" onClick={() => removeProject(proj.id)} type="button">
                      Remove Project
                    </button>
                  </div>
                ))}
                <button className="ghost" onClick={addProject} type="button">
                  Add Project
                </button>
              </div>

              <div
                className={`section ${activeSection === 'education' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.education = el)}
              >
                <h3>Education</h3>
                {resume.education.map((edu) => (
                  <div key={edu.id} className="subcard">
                    <div className="grid two">
                      <label className="field">
                        <span>School</span>
                        <input
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                          placeholder="University of..."
                        />
                      </label>
                      <label className="field">
                        <span>Degree</span>
                        <input
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          placeholder="BSc, Business"
                        />
                      </label>
                      <label className="field">
                        <span>Location</span>
                        <input
                          value={edu.location}
                          onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                          placeholder="Boston, MA"
                        />
                      </label>
                      <label className="field">
                        <span>Start</span>
                        <input
                          value={edu.start}
                          onChange={(e) => updateEducation(edu.id, 'start', e.target.value)}
                          placeholder="2017"
                        />
                      </label>
                      <label className="field">
                        <span>End</span>
                        <input
                          value={edu.end}
                          onChange={(e) => updateEducation(edu.id, 'end', e.target.value)}
                          placeholder="2021"
                        />
                      </label>
                    </div>
                    {edu.details.map((detail, index) => (
                      <div className="inline-row" key={`${edu.id}-detail-${index}`}>
                        <input
                          value={detail}
                          onChange={(e) => updateEducationDetail(edu.id, index, e.target.value)}
                          placeholder="Honors, thesis, or coursework"
                        />
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => removeEducationDetail(edu.id, index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button className="ghost" onClick={() => addEducationDetail(edu.id)} type="button">
                      Add Detail
                    </button>
                    <button className="ghost" onClick={() => removeEducation(edu.id)} type="button">
                      Remove Education
                    </button>
                  </div>
                ))}
                <button className="ghost" onClick={addEducation} type="button">
                  Add Education
                </button>
              </div>

              <div
                className={`section ${activeSection === 'certifications' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.certifications = el)}
              >
                <h3>Certifications</h3>
                {resume.certifications.map((cert) => (
                  <div className="inline-row" key={cert.id}>
                    <input
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                      placeholder="Certification"
                    />
                    <input
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                      placeholder="Issuer"
                    />
                    <input
                      value={cert.year}
                      onChange={(e) => updateCertification(cert.id, 'year', e.target.value)}
                      placeholder="Year"
                    />
                    <button className="ghost" onClick={() => removeCertification(cert.id)} type="button">
                      Remove
                    </button>
                  </div>
                ))}
                <button className="ghost" onClick={addCertification} type="button">
                  Add Certification
                </button>
              </div>

              <div
                className={`section ${activeSection === 'languages' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.languages = el)}
              >
                <h3>Languages</h3>
                {resume.languages.map((lang) => (
                  <div className="inline-row" key={lang.id}>
                    <input
                      value={lang.name}
                      onChange={(e) => updateLanguage(lang.id, 'name', e.target.value)}
                      placeholder="Language"
                    />
                    <input
                      value={lang.level}
                      onChange={(e) => updateLanguage(lang.id, 'level', e.target.value)}
                      placeholder="Proficiency"
                    />
                    <button className="ghost" onClick={() => removeLanguage(lang.id)} type="button">
                      Remove
                    </button>
                  </div>
                ))}
                <button className="ghost" onClick={addLanguage} type="button">
                  Add Language
                </button>
              </div>

              <div
                className={`section ${activeSection === 'custom' ? 'focused' : ''}`}
                ref={(el) => (sectionRefs.current.custom = el)}
              >
                <h3>Custom Sections</h3>
                {resume.customSections.map((sec) => (
                  <div key={sec.id} className="subcard">
                    <label className="field">
                      <span>Title</span>
                      <input
                        value={sec.title}
                        onChange={(e) => updateCustomSectionTitle(sec.id, e.target.value)}
                      />
                    </label>
                    {sec.items.map((item, index) => (
                      <div className="inline-row" key={`${sec.id}-item-${index}`}>
                        <input
                          value={item}
                          onChange={(e) => updateCustomSectionItem(sec.id, index, e.target.value)}
                          placeholder="Bullet or detail"
                        />
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => removeCustomSectionItem(sec.id, index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button className="ghost" onClick={() => addCustomSectionItem(sec.id)} type="button">
                      Add Item
                    </button>
                    <button className="ghost" onClick={() => removeCustomSection(sec.id)} type="button">
                      Remove Section
                    </button>
                  </div>
                ))}
                <button className="ghost" onClick={addCustomSection} type="button">
                  Add Custom Section
                </button>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <h2>Final Check</h2>
            {redFlags.length ? (
              <ul className="flag-list">
                {redFlags.map((flag, index) => (
                  <li key={`flag-${index}`}>{flag}</li>
                ))}
              </ul>
            ) : (
              <p className="status">No red flags detected. Ready for export.</p>
            )}
          </div>

          <div className="panel-card">
            <button className="ghost danger" onClick={clearLocalData} type="button">
              Clear Local Data
            </button>
            <p className="hint">Everything is stored in your browser local storage. For large files or multi-page CVs, a backend storage may be needed later.</p>
          </div>
        </section>

        <section className="panel right">
          <div className="preview-wrapper" style={templateStyle}>
            <div className={`preview ${templateId} ${layoutClass}`} ref={previewRef}>
              {!isSingleLayout && (
                <div className="preview-sidebar">
                  <div className="preview-photo">
                    {resume.imageDataUrl ? (
                      <img src={resume.imageDataUrl} alt="Profile" />
                    ) : (
                      <div className="photo-placeholder">Photo</div>
                    )}
                  </div>
                  <div className="preview-block clickable" {...sectionClickProps('contact')}>
                    <h4>Contact</h4>
                    <p>{resume.contact.email || 'email@domain.com'}</p>
                    <p>{resume.contact.phone || '+1 555 0123'}</p>
                    <p>{resume.contact.location || 'City, Country'}</p>
                    {resume.contact.linkedin && (
                      <p>
                        <a
                          href={sanitizeUrl(resume.contact.linkedin)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {resume.contact.linkedin}
                        </a>
                      </p>
                    )}
                    {resume.contact.website && (
                      <p>
                        <a
                          href={sanitizeUrl(resume.contact.website)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {resume.contact.website}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="preview-block clickable" {...sectionClickProps('skills')}>
                    <h4>Skills</h4>
                    <ul>
                      {resume.skills.filter(Boolean).map((skill, index) => (
                        <li key={`skill-prev-${index}`}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="preview-block clickable" {...sectionClickProps('certifications')}>
                    <h4>Certifications</h4>
                    <ul>
                      {resume.certifications.filter((c) => c.name).map((cert) => (
                        <li key={cert.id}>
                          {cert.name} {cert.issuer ? `• ${cert.issuer}` : ''} {cert.year ? `(${cert.year})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="preview-block clickable" {...sectionClickProps('languages')}>
                    <h4>Languages</h4>
                    <ul>
                      {resume.languages.filter((l) => l.name).map((lang) => (
                        <li key={lang.id}>
                          {lang.name} {lang.level ? `- ${lang.level}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="preview-main">
                {isSingleLayout ? (
                  <div className="single-header">
                    <div className="single-photo">
                      {resume.imageDataUrl ? (
                        <img src={resume.imageDataUrl} alt="Profile" />
                      ) : (
                        <div className="photo-placeholder">Photo</div>
                      )}
                    </div>
                    <h2 className="single-name">{resume.contact.fullName || 'Your Name'}</h2>
                    <h3 className="single-role">{resume.contact.role || 'Target Role'}</h3>
                    <div className="single-contact clickable" {...sectionClickProps('contact')}>
                      <span>{resume.contact.email || 'email@domain.com'}</span>
                      <span>{resume.contact.phone || '+1 555 0123'}</span>
                      <span>{resume.contact.location || 'City, Country'}</span>
                      {resume.contact.linkedin && (
                        <a
                          href={sanitizeUrl(resume.contact.linkedin)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {resume.contact.linkedin}
                        </a>
                      )}
                      {resume.contact.website && (
                        <a
                          href={sanitizeUrl(resume.contact.website)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {resume.contact.website}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="preview-header">
                    <h2>{resume.contact.fullName || 'Your Name'}</h2>
                    <h3>{resume.contact.role || 'Target Role'}</h3>
                  </div>
                )}
                <section className="clickable" {...sectionClickProps('summary')}>
                  <h4>Summary</h4>
                  <p>{resume.summary || 'Add a compelling professional summary.'}</p>
                </section>
                <section className="clickable" {...sectionClickProps('experience')}>
                  <h4>Experience</h4>
                  {resume.experiences.filter((exp) => exp.role || exp.company).map((exp) => (
                    <div key={exp.id} className="preview-entry">
                      <div className="entry-title">
                        <span>{exp.role || 'Role Title'}</span>
                        <span>{exp.company}</span>
                      </div>
                      <div className="entry-meta">
                        <span>{exp.location}</span>
                        <span>
                          {exp.start} {exp.start || exp.end ? ' - ' : ''} {exp.end}
                        </span>
                      </div>
                      <ul>
                        {exp.bullets.filter(Boolean).map((bullet, index) => (
                          <li key={`${exp.id}-prev-${index}`}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
                <section className="clickable" {...sectionClickProps('projects')}>
                  <h4>Projects</h4>
                  {resume.projects.filter((proj) => proj.name || proj.description).map((proj) => (
                    <div key={proj.id} className="preview-entry">
                      <div className="entry-title">
                        <span>{proj.name || 'Project Name'}</span>
                        <span>{proj.link}</span>
                      </div>
                      <p>{proj.description}</p>
                      <ul>
                        {proj.bullets.filter(Boolean).map((bullet, index) => (
                          <li key={`${proj.id}-prev-${index}`}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
                <section className="clickable" {...sectionClickProps('education')}>
                  <h4>Education</h4>
                  {resume.education.filter((edu) => edu.school || edu.degree).map((edu) => (
                    <div key={edu.id} className="preview-entry">
                      <div className="entry-title">
                        <span>{edu.school || 'School'}</span>
                        <span>{edu.degree}</span>
                      </div>
                      <div className="entry-meta">
                        <span>{edu.location}</span>
                        <span>
                          {edu.start} {edu.start || edu.end ? ' - ' : ''} {edu.end}
                        </span>
                      </div>
                      <ul>
                        {edu.details.filter(Boolean).map((detail, index) => (
                          <li key={`${edu.id}-detail-prev-${index}`}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
                {isSingleLayout && (
                  <>
                    <section className="clickable" {...sectionClickProps('skills')}>
                      <h4>Skills</h4>
                      <ul>
                        {resume.skills.filter(Boolean).map((skill, index) => (
                          <li key={`skill-single-${index}`}>{skill}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="clickable" {...sectionClickProps('certifications')}>
                      <h4>Certifications</h4>
                      <ul>
                        {resume.certifications.filter((c) => c.name).map((cert) => (
                          <li key={`cert-single-${cert.id}`}>
                            {cert.name} {cert.issuer ? `• ${cert.issuer}` : ''} {cert.year ? `(${cert.year})` : ''}
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section className="clickable" {...sectionClickProps('languages')}>
                      <h4>Languages</h4>
                      <ul>
                        {resume.languages.filter((l) => l.name).map((lang) => (
                          <li key={`lang-single-${lang.id}`}>
                            {lang.name} {lang.level ? `- ${lang.level}` : ''}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )}
                {resume.customSections.map((sec) => (
                  <section key={sec.id} className="clickable" {...sectionClickProps('custom')}>
                    <h4>{sec.title}</h4>
                    <ul>
                      {sec.items.filter(Boolean).map((item, index) => (
                        <li key={`${sec.id}-custom-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
