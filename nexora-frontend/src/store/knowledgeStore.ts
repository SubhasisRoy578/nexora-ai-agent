// src/stores/knowledgeStore.ts
import { create } from 'zustand'
import { getKnowledge, uploadDocument, deleteDoc } from '../lib/api'

export interface Document {
  id: string
  name: string
  size: string
  chunks: number
  date: string
  status: 'indexed' | 'processing' | 'failed'
  icon: string
  type: string
}

interface KnowledgeStore {
  docs: Document[]
  loading: boolean
  uploading: boolean
  error: string | null
  fetchDocs: () => Promise<void>
  upload: (file: File) => Promise<any>
  delete: (docId: string) => Promise<void>
  setError: (e: string | null) => void
}

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  docs: [],
  loading: false,
  uploading: false,
  error: null,

  fetchDocs: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getKnowledge()
      set({ docs: data })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch docs'
      set({ error: errMsg })
    } finally {
      set({ loading: false })
    }
  },

  upload: async (file: File) => {
    set({ uploading: true, error: null })
    try {
      const result = await uploadDocument(file)
      set((s) => ({ docs: [...s.docs, result] }))
      return result
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Upload failed'
      set({ error: errMsg })
      throw err
    } finally {
      set({ uploading: false })
    }
  },

  delete: async (docId: string) => {
    try {
      await deleteDoc(docId)
      set((s) => ({ docs: s.docs.filter((d) => d.id !== docId) }))
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Delete failed'
      set({ error: errMsg })
    }
  },

  setError: (error) => set({ error }),
}))
