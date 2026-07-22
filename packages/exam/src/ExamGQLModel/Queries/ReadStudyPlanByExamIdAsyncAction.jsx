/**
 * @fileoverview GraphQL dotazy pro načítání studijních plánů souvisejících se zkouškami.
 * Poskytuje akce pro načtení studijního plánu podle jeho ID nebo podle ID zkoušky.
 * @module ExamGQLModel/Queries/ReadStudyPlanByExamIdAsyncAction
 */

import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared"
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2"

/**
 * GraphQL query pro načtení studijního plánu podle jeho ID.
 * Vrací ID plánu, ID semestru a informace o semestru včetně předmětu.
 * @constant {string}
 */
const ReadStudyPlanByIdQueryStr = `
query studyPlanById($id: UUID!) {
  studyPlanById(id: $id) {
    __typename
    id
    lastchange
    semesterId
    semester {
      __typename
      id
      order
      subject {
        __typename
        id
        name
      }
    }
  }
}
`

/**
 * GraphQL query pro načtení studijního plánu podle ID zkoušky.
 * Používá stránkovaný dotaz s filtrem na exam_id.
 * @constant {string}
 */
const ReadStudyPlanByExamIdQueryStr = `
query studyPlanByExamId($skip: Int, $limit: Int, $where: StudyPlanInputFilter) {
  studyPlanPage(skip: $skip, limit: $limit, where: $where) {
    __typename
    id
    lastchange
    semesterId
    semester {
      __typename
      id
      order
      subject {
        __typename
        id
        name
      }
    }
  }
}
`

/**
 * Lazy-loaded GraphQL query pro načtení studijního plánu podle ID.
 * @type {Function}
 */
const ReadStudyPlanByIdQuery = createQueryStrLazy(`${ReadStudyPlanByIdQueryStr}`)

/**
 * Lazy-loaded GraphQL query pro načtení studijního plánu podle examId.
 * @type {Function}
 */
const ReadStudyPlanByExamIdQuery = createQueryStrLazy(`${ReadStudyPlanByExamIdQueryStr}`)

/**
 * Asynchronní Redux akce pro načtení studijního plánu podle jeho ID.
 * @type {Function}
 * @param {Object} params - Parametry dotazu.
 * @param {string} params.id - UUID studijního plánu.
 * @returns {Promise<Object>} Data studijního plánu včetně semestru a předmětu.
 */
export const ReadStudyPlanByIdAsyncAction = createAsyncGraphQLAction2(ReadStudyPlanByIdQuery)

/**
 * Asynchronní Redux akce pro načtení studijního plánu podle ID zkoušky.
 * @type {Function}
 * @param {Object} params - Parametry dotazu.
 * @param {Object} params.where - Filtrační podmínky.
 * @param {Object} params.where.exam_id - Filtr na exam_id.
 * @param {Object} params.where.exam_id._eq - UUID zkoušky pro filtrování.
 * @param {number} [params.limit] - Maximální počet vrácených záznamů.
 * @param {number} [params.skip] - Počet záznamů k přeskočení.
 * @returns {Promise<Object>} Stránka studijních plánů odpovídajících filtru.
 */
export const ReadStudyPlanByExamIdAsyncAction = createAsyncGraphQLAction2(ReadStudyPlanByExamIdQuery)
