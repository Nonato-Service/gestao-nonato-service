'use client'

import { useId, useRef } from 'react'
import { compressProfilePhotoFile } from '../../lib/compressProfilePhoto'
import { iniciaisPessoa } from '../../lib/pessoaTypes'

type Props = {
  photo: string
  name?: string
  onPhotoChange: (dataUrl: string) => void
  onRemovePhoto: () => void
  labels: {
    title?: string
    add?: string
    remove?: string
    hint?: string
    invalidImage?: string
    tooLarge?: string
  }
  variant?: 'gestor' | 'tecnico'
}

export function PessoaPhotoField({
  photo,
  name = '',
  onPhotoChange,
  onRemovePhoto,
  labels,
  variant = 'gestor',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const compressed = await compressProfilePhotoFile(file)
      onPhotoChange(compressed)
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'file_too_large') {
        alert(labels.tooLarge || 'Imagem demasiado grande. Use uma foto até 12 MB.')
      } else {
        alert(labels.invalidImage || 'Selecione uma imagem válida (JPG, PNG, etc.).')
      }
    }
  }

  return (
    <section className={`gt-photo gt-photo--${variant}`}>
      <h3 className="gt-photo__title">{labels.title || 'Foto da pessoa'}</h3>
      <p className="gt-photo__hint">{labels.hint || 'Clique para carregar. A foto é redimensionada automaticamente.'}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="gt-photo__input"
        onChange={(e) => void handleFile(e)}
      />
      <button type="button" className="gt-photo__drop" onClick={() => inputRef.current?.click()}>
        {photo ? (
          <img src={photo} alt="" className="gt-photo__preview" />
        ) : (
          <span className="gt-photo__placeholder" aria-hidden="true">
            {iniciaisPessoa(name) || '📷'}
          </span>
        )}
        <span className="gt-photo__drop-label">{photo ? labels.title || 'Alterar foto' : labels.add || 'Adicionar foto'}</span>
      </button>
      {photo ? (
        <button type="button" className="gt-photo__remove" onClick={onRemovePhoto}>
          {labels.remove || 'Remover foto'}
        </button>
      ) : null}
    </section>
  )
}

type AvatarProps = {
  name: string
  photo?: string
  size?: 'sm' | 'md' | 'lg' | 'card'
  accent?: string
}

export function PessoaAvatar({ name, photo, size = 'md', accent }: AvatarProps) {
  const cls = `gt-avatar gt-avatar--${size}`
  if (photo) {
    return <img src={photo} alt={name} className={cls} />
  }
  return (
    <span className={cls} style={accent ? { background: accent } : undefined} aria-hidden="true">
      {iniciaisPessoa(name)}
    </span>
  )
}
