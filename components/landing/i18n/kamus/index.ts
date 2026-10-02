import type { Bahasa } from '../bahasa'
import type { Kamus } from './tipe'
import { id } from './id'
import { en } from './en'
import { ja } from './ja'
import { tr } from './tr'
import { de } from './de'
import { ko } from './ko'

export type { Kamus, KunciCari } from './tipe'

export const KAMUS: Record<Bahasa, Kamus> = { id, en, ja, tr, de, ko }
