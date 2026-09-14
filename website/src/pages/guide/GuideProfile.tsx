import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CaretRight,
  Star,
  SignOut,
  Question,
  IdentificationCard,
  PencilSimple,
  Check,
  Eye,
  EyeSlash,
  SealCheck,
  Plus,
} from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { getMyGuideProfile, updateMyGuideProfile, addMyCertification, type GuideStatus } from '../../api/guides'
import { changePassword } from '../../api/auth'
import { useFetch } from '../../lib/useFetch'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const AVAILABILITY_OPTIONS: GuideStatus[] = ['Available', 'On Trip', 'Off-Duty']

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-sand-stone rounded-lg pl-3 pr-11 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        {visible ? <Eye size={18} /> : <EyeSlash size={18} />}
      </button>
    </div>
  )
}

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function GuideProfile() {
  const { data: guide, loading, refetch } = useFetch(getMyGuideProfile, [])
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || user?.email || 'Guide'

  const [availability, setAvailability] = useState<GuideStatus>('Available')
  const [savingAvailability, setSavingAvailability] = useState(false)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(displayName)
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [bioDraft, setBioDraft] = useState('')
  const [languagesDraft, setLanguagesDraft] = useState('')
  const [specialtiesDraft, setSpecialtiesDraft] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsSaved, setDetailsSaved] = useState(false)

  const [certTitle, setCertTitle] = useState('')
  const [certValidUntil, setCertValidUntil] = useState('')
  const [certDocument, setCertDocument] = useState('')
  const [addingCert, setAddingCert] = useState(false)
  const [certError, setCertError] = useState<string | null>(null)

  // availability and the bio/languages/specialties drafts both resync from
  // guide whenever a *new* guide object arrives — the initial load, and again
  // after every save-triggered refetch() (handleSaveAvailability/Details).
  // Reset during render, comparing against the previous value in state, not
  // in an effect: an effect-based reset here is exactly what this repo's
  // stricter react-hooks/set-state-in-effect rule flags, and (per ESLint) two
  // of the four setState calls across these effects weren't even earning
  // their eslint-disable comments — the redundant-effects version of the same
  // problem this rule exists to catch.
  const [prevGuide, setPrevGuide] = useState(guide)
  if (guide !== prevGuide) {
    setPrevGuide(guide)
    if (guide) {
      setAvailability(guide.status)
      setBioDraft(guide.bio)
      setLanguagesDraft(guide.languages.join(', '))
      setSpecialtiesDraft(guide.specialties.join(', '))
    }
  }

  // nameDraft resyncs from displayName the same way — the initial value, and
  // again after a name save (handleSaveName calls refreshUser(), which
  // changes `user` and therefore displayName).
  const [prevDisplayName, setPrevDisplayName] = useState(displayName)
  if (displayName !== prevDisplayName) {
    setPrevDisplayName(displayName)
    setNameDraft(displayName)
  }

  async function handleSignOut() {
    await logout()
    navigate('/')
  }

  async function handleAvailabilityChange(option: GuideStatus) {
    if (!guide || option === availability) return
    const previous = availability
    setAvailability(option)
    setSavingAvailability(true)
    try {
      await updateMyGuideProfile({ status: option })
    } catch {
      setAvailability(previous)
    } finally {
      setSavingAvailability(false)
    }
  }

  async function handleSaveName(event: FormEvent) {
    event.preventDefault()
    if (!guide) return
    setNameError(null)
    setSavingName(true)
    try {
      await updateMyGuideProfile({ name: nameDraft.trim() })
      await refreshUser()
      refetch()
      setEditingName(false)
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : 'Failed to update name.')
    } finally {
      setSavingName(false)
    }
  }

  async function handleSaveDetails(event: FormEvent) {
    event.preventDefault()
    if (!guide) return
    setDetailsError(null)
    setDetailsSaved(false)
    setSavingDetails(true)
    try {
      await updateMyGuideProfile({
        bio: bioDraft,
        languages: parseList(languagesDraft),
        specialties: parseList(specialtiesDraft),
      })
      refetch()
      setDetailsSaved(true)
    } catch (err) {
      setDetailsError(err instanceof ApiError ? err.message : 'Failed to update details.')
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleAddCertification(event: FormEvent) {
    event.preventDefault()
    setCertError(null)
    setAddingCert(true)
    try {
      await addMyCertification({ title: certTitle, validUntil: certValidUntil, document: certDocument })
      refetch()
      setCertTitle('')
      setCertValidUntil('')
      setCertDocument('')
    } catch (err) {
      setCertError(err instanceof ApiError ? err.message : 'Failed to add certification.')
    } finally {
      setAddingCert(false)
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to change password.')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar title="My Profile" />

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto min-h-screen">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center text-3xl font-headline-md text-on-surface-variant border-4 border-surface-container-lowest shadow-sm">
            {initials(displayName)}
          </div>

          {editingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-4">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="bg-surface border border-sand-stone rounded-lg px-3 py-1.5 text-center font-headline-md text-[18px] text-on-surface focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
              <button
                type="submit"
                disabled={savingName || !nameDraft.trim()}
                aria-label="Save name"
                className="p-2 text-savanna-green hover:bg-surface-container rounded-full transition-colors disabled:opacity-50"
              >
                <Check size={18} weight="bold" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 mt-4 group"
            >
              <h2 className="font-headline-md text-[22px] text-on-surface">{displayName}</h2>
              <PencilSimple size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          {nameError && <p className="text-error text-xs mt-1">{nameError}</p>}

          {guide && (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
                {guide.role}
              </span>
            </div>
          )}
          <Link to="/guide/reviews" className="flex items-center gap-1 mt-2 text-golden-sun">
            <Star size={18} weight="fill" />
            <span className="font-label-md text-on-surface">{loading ? '—' : (guide?.rating ?? '—')}</span>
          </Link>
        </div>

        {!guide && !loading && (
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4 text-center">
            <IdentificationCard size={28} className="text-on-surface-variant mx-auto mb-2" />
            <p className="text-on-surface-variant text-sm">
              No guide profile is linked to this account yet — ask an admin to link it.
            </p>
          </div>
        )}

        {guide && (
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
            <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Availability</h3>
            <div className="flex gap-2">
              {AVAILABILITY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={savingAvailability}
                  onClick={() => handleAvailabilityChange(option)}
                  className={`flex-1 py-2 rounded-full font-label-sm text-label-sm transition-colors disabled:opacity-60 ${
                    availability === option ? 'bg-golden-sun text-on-secondary-fixed-variant font-bold' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {guide && (
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
            <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Bio &amp; Details</h3>
            <form onSubmit={handleSaveDetails} className="space-y-3">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={3}
                placeholder="A short bio guests will see..."
                className="w-full bg-surface border border-sand-stone rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
              <input
                value={languagesDraft}
                onChange={(e) => setLanguagesDraft(e.target.value)}
                placeholder="Languages spoken (comma-separated)"
                className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
              <input
                value={specialtiesDraft}
                onChange={(e) => setSpecialtiesDraft(e.target.value)}
                placeholder="Specialties (comma-separated)"
                className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
              {detailsError && <p className="text-error text-xs">{detailsError}</p>}
              {detailsSaved && <p className="text-savanna-green text-xs">Saved.</p>}
              <button
                type="submit"
                disabled={savingDetails}
                className="w-full bg-surface-container text-on-surface py-2.5 rounded-lg font-label-md text-label-sm hover:bg-surface-container-high transition-colors disabled:opacity-60"
              >
                {savingDetails ? 'Saving…' : 'Save Details'}
              </button>
            </form>

            {(guide.languages.length > 0 || guide.specialties.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-variant">
                {guide.languages.map((lang) => (
                  <span key={lang} className="font-label-sm text-label-sm bg-surface-container text-on-surface px-3 py-1.5 rounded-full">
                    {lang}
                  </span>
                ))}
                {guide.specialties.map((s) => (
                  <span
                    key={s}
                    className="font-label-sm text-label-sm bg-primary-fixed-dim/20 text-on-primary-fixed-variant px-3 py-1.5 rounded-full border border-primary-fixed-dim/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {guide && (
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
            <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Certifications</h3>
            <div className="space-y-3 mb-4">
              {guide.certifications.length === 0 && (
                <p className="text-on-surface-variant text-sm">No certifications added yet.</p>
              )}
              {guide.certifications.map((cert) => (
                <div key={cert.id} className="flex items-center gap-3">
                  <SealCheck size={22} weight="fill" className="text-savanna-green shrink-0" />
                  <div className="flex-1">
                    <p className="font-label-md text-on-surface">{cert.title}</p>
                    {cert.validUntil && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Valid until {cert.validUntil}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddCertification} className="space-y-2">
              <input
                required
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="Certification title"
                className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
              <input
                type="date"
                value={certValidUntil}
                onChange={(e) => setCertValidUntil(e.target.value)}
                className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
              <input
                value={certDocument}
                onChange={(e) => setCertDocument(e.target.value)}
                placeholder="Document URL (optional)"
                className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
              {certError && <p className="text-error text-xs">{certError}</p>}
              <button
                type="submit"
                disabled={addingCert}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-outline-variant rounded-lg py-2.5 text-on-surface-variant hover:border-primary hover:text-primary transition-colors font-label-md text-label-sm disabled:opacity-60"
              >
                <Plus size={18} />
                {addingCert ? 'Adding…' : 'Add Certification'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              placeholder="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              placeholder="New password"
              value={newPassword}
              onChange={setNewPassword}
            />
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {passwordError && <p className="text-error text-xs">{passwordError}</p>}
            {passwordSuccess && <p className="text-savanna-green text-xs">Password updated.</p>}
            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-savanna-green text-on-primary py-2.5 rounded-lg font-label-md text-label-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {changingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <Link
            to="/guide/support"
            className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-surface-variant/50"
          >
            <span className="flex items-center gap-3 font-label-md text-on-surface">
              <Question size={20} className="text-on-surface-variant" />
              Support
            </span>
            <CaretRight size={20} className="text-on-surface-variant" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-error/30 text-error font-label-md text-label-md"
          >
            <SignOut size={20} />
            Sign Out
          </button>
        </div>
      </main>

      <GuideBottomNav active="profile" />
    </div>
  )
}
