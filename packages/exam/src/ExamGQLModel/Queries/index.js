/**
 * @fileoverview Exportní modul pro všechny GraphQL dotazy a mutace modelu ExamGQLModel.
 * Tento soubor slouží jako centrální bod pro re-export všech asynchronních akcí
 * pro práci s daty zkoušek přes GraphQL API.
 * @module ExamGQLModel/Queries
 */

/** Asynchronní akce pro vložení nové zkoušky. */
export { InsertAsyncAction } from './InsertAsyncAction'

/** Asynchronní akce pro aktualizaci existující zkoušky. */
export { UpdateAsyncAction } from './UpdateAsyncAction'

/** Asynchronní akce pro smazání zkoušky. */
export { DeleteAsyncAction } from './DeleteAsyncAction'

/** Asynchronní akce pro načtení jedné zkoušky podle ID. */
export { ReadAsyncAction } from './ReadAsyncAction'

/** Asynchronní akce pro načtení stránkovaného seznamu zkoušek. */
export { ReadPageAsyncAction } from './ReadPageAsyncAction'

/** Asynchronní akce pro načtení studijního plánu podle ID nebo examId. */
export { ReadStudyPlanByIdAsyncAction, ReadStudyPlanByExamIdAsyncAction } from './ReadStudyPlanByExamIdAsyncAction'
