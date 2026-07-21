/**
 * @fileoverview GraphQL fragmenty pro model ExamGQLModel.
 * Definuje fragmenty pro různé úrovně detailu dat zkoušky (Link, Medium, Large)
 * a související fragmenty pro role a RBAC oprávnění.
 * @module ExamGQLModel/Queries/Fragments
 */

import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared"

/**
 * GraphQL fragment pro základní (link) úroveň dat zkoušky.
 * Obsahuje všechna základní pole včetně identifikátorů, názvů, popisů a bodů.
 * @constant {string}
 */
const LinkFragmentStr = `
fragment Link on ExamGQLModel {
  __typename
  id
  lastchange
  created
  createdbyId
  changedbyId
  rbacobjectId
  name
  nameEn
  description
  descriptionEn
  typeId
  parentId
  parent {
    id
    name
  }
  planId
  minScore
  maxScore
}
`

/**
 * GraphQL fragment pro střední úroveň dat zkoušky.
 * Rozšiřuje Link fragment o informace o RBAC objektu.
 * @constant {string}
 */
const MediumFragmentStr = `
fragment Medium on ExamGQLModel {
  ...Link
  rbacobject {
    ...RBRoles
  }
}
`

/**
 * GraphQL fragment pro velkou úroveň dat zkoušky.
 * Rozšiřuje Medium fragment o části (parts) zkoušky.
 * @constant {string}
 */
const LargeFragmentStr = `
fragment Large on ExamGQLModel {
  ...Medium
  parts{...Link}
}
`

/**
 * GraphQL fragment pro data role.
 * Obsahuje kompletní informace o roli včetně vazeb na uživatele a skupinu.
 * @constant {string}
 */
const RoleFragmentStr = `
fragment Role on RoleGQLModel {
    __typename
    id
    lastchange
    created
    createdbyId
    changedbyId
    rbacobjectId
    createdby { id __typename }
    changedby { id __typename }
    rbacobject { id __typename }
    valid
    deputy
    startdate
    enddate
    roletypeId
    userId
    groupId
    roletype { __typename id }
    user { __typename id fullname }
    group { __typename id name }
  }
`

/**
 * GraphQL fragment pro RBAC role aktuálního uživatele.
 * Obsahuje informace o rolích přiřazených k danému RBAC objektu.
 * @constant {string}
 */
const RBACFragmentStr = `
fragment RBRoles on RBACObjectGQLModel {
  __typename
  id
  currentUserRoles {
    __typename
    id
    lastchange
    valid
    startdate
    enddate
    roletype {
      __typename
      id
      name
    }
    group {
      __typename
      id
      name
      grouptype {
        __typename
        id
        name
      }
    }
  }
}`

/**
 * Lazy-loaded GraphQL fragment pro roli.
 * @type {Function}
 */
export const RoleFragment = createQueryStrLazy(`${RoleFragmentStr}`)

/**
 * Lazy-loaded GraphQL fragment pro RBAC role.
 * @type {Function}
 */
export const RBACFragment = createQueryStrLazy(`${RBACFragmentStr}`)

/**
 * Lazy-loaded GraphQL fragment pro základní úroveň dat zkoušky.
 * @type {Function}
 */
export const LinkFragment = createQueryStrLazy(`${LinkFragmentStr}`)

/**
 * Lazy-loaded GraphQL fragment pro střední úroveň dat zkoušky.
 * Závisí na LinkFragment a RBACFragment.
 * @type {Function}
 */
export const MediumFragment = createQueryStrLazy(`${MediumFragmentStr}`, LinkFragment, RBACFragment)

/**
 * Lazy-loaded GraphQL fragment pro velkou úroveň dat zkoušky.
 * Závisí na MediumFragment.
 * @type {Function}
 */
export const LargeFragment = createQueryStrLazy(`${LargeFragmentStr}`, MediumFragment)
  