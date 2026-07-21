/**
 * @fileoverview GraphQL mutace pro aktualizaci zkoušky.
 * Poskytuje asynchronní akci pro úpravu existujících záznamů zkoušek.
 * @module ExamGQLModel/Queries/UpdateAsyncAction
 */

import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared";
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2";
import { reduceToFirstEntity, updateItemsFromGraphQLResult } from "../../../../dynamic/src/Store";
import { LargeFragment } from "./Fragments";

/**
 * GraphQL mutace pro aktualizaci zkoušky.
 * Umožňuje aktualizovat název, popis, body, typ a studijní plán.
 * Vrací buď aktualizovaný model zkoušky nebo chybový objekt.
 * @constant {string}
 */
const UpdateMutationStr = `
mutation examUpdate($id: UUID!, $lastchange: DateTime!, $name: String, $nameEn: String, $description: String, $descriptionEn: String, $minScore: Int, $maxScore: Int, $typeId: UUID, $planId: UUID) {
  examUpdate(exam: {id: $id, lastchange: $lastchange, name: $name, nameEn: $nameEn, description: $description, descriptionEn: $descriptionEn, minScore: $minScore, maxScore: $maxScore, typeId: $typeId, planId: $planId}) {
    ... on ExamGQLModel { ...Large }
    ... on ExamGQLModelUpdateError { ...Error }
  }
}

fragment Error on ExamGQLModelUpdateError {
  __typename
  Entity {
    ...Large
  }
  msg
  failed
  code
  location
  input
}
`

/**
 * Lazy-loaded GraphQL mutace pro aktualizaci zkoušky.
 * Závisí na LargeFragment pro kompletní data odpovědi.
 * @type {Function}
 */
const UpdateMutation = createQueryStrLazy(UpdateMutationStr, LargeFragment)

/**
 * Asynchronní Redux akce pro aktualizaci zkoušky.
 * Provede GraphQL mutaci a aktualizuje store s výsledkem.
 * @type {Function}
 * @param {Object} params - Parametry pro aktualizaci.
 * @param {string} params.id - Jedinečný identifikátor zkoušky.
 * @param {string} params.lastchange - Timestamp poslední změny (pro optimistické zamykání).
 * @param {string} [params.name] - Nový název zkoušky.
 * @param {string} [params.nameEn] - Nový anglický název zkoušky.
 * @param {string} [params.description] - Nový popis zkoušky.
 * @param {string} [params.descriptionEn] - Nový anglický popis zkoušky.
 * @param {number} [params.minScore] - Nový minimální počet bodů.
 * @param {number} [params.maxScore] - Nový maximální počet bodů.
 * @param {string} [params.typeId] - Nové ID typu zkoušky.
 * @param {string} [params.planId] - Nové ID studijního plánu.
 * @returns {Promise<Object>} Aktualizovaná data zkoušky.
 */
export const UpdateAsyncAction = createAsyncGraphQLAction2(
  UpdateMutation,
  updateItemsFromGraphQLResult,
  reduceToFirstEntity
)