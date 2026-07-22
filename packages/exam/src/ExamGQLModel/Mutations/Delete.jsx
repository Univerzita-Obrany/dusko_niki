/**
 * @fileoverview Komponenty a akce pro mazání zkoušky (exam) včetně kaskádového smazání.
 * Zajišťuje správné pořadí operací: odpojení studijních plánů → smazání parts → smazání rodiče.
 * @module ExamGQLModel/Mutations/Delete
 */

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteItemURI, ListURI, MediumContent } from "../Components";
import { DeleteAsyncAction, ReadAsyncAction, ReadStudyPlanByExamIdAsyncAction } from "../Queries";
import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared";
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2";
import {
    DeleteButton as BaseDeleteButton,
    DeleteDialog as BaseDeleteDialog,
    DeleteLink as BaseDeleteLink
} from "../../../../_template/src/Base/Mutations/Delete";
import { useGQLEntityContext } from "../../../../_template/src/Base/Helpers/GQLEntityProvider";
import { PermissionGate, usePermissionGateContext } from "../../../../dynamic/src/Hooks/useRoles";
import { useAsyncThunkAction } from "../../../../dynamic/src/Hooks";
import { AsyncStateIndicator } from "../../../../_template/src/Base/Helpers/AsyncStateIndicator";

const DefaultContent = MediumContent

const permissions = {
    oneOfRoles: ["administrátor"],
    mode: "absolute",
}

/**
 * Middleware pro GraphQL akce na studijním plánu.
 * Přeskočí normalizaci výsledku (aby nevyžadoval `__typename`) a vyhodí chybu při `failed: true`.
 * @param {Object} result - Surový GraphQL výsledek.
 * @returns {Function} Redux middleware thunk.
 */
const unlinkMiddleware = (result) => async (dispatch, getState, next) => {
    const dataRoot = result?.data ?? result
    const updateResult = dataRoot?.result ?? dataRoot?.studyPlanUpdate
    if (updateResult?.failed) {
        const err = new Error(updateResult.msg || "Plan unlink failed")
        err.errors = updateResult
        throw err
    }
    return next(result)
}

/**
 * GraphQL akce, která nastaví `examId = null` na studijním plánu — odpojí ho od examu.
 * @type {Function}
 * @param {Object} vars
 * @param {string} vars.id - UUID studijního plánu.
 * @param {string} vars.lastchange - Timestamp poslední změny plánu.
 */
const UnlinkPlanAction = createAsyncGraphQLAction2(createQueryStrLazy(`
mutation UnlinkStudyPlan($id: UUID!, $lastchange: DateTime!) {
  result: studyPlanUpdate(studyPlan: {id: $id, lastchange: $lastchange, examId: null}) {
    ... on StudyPlanGQLModelUpdateError { failed msg }
    ... on StudyPlanGQLModel { id lastchange }
  }
}
`), unlinkMiddleware)

/**
 * Pomocná funkce, která najde studijní plán propojený s daným examem (přes `exam_id`)
 * a nastaví jeho `examId` na `null`.
 * Pokud žádný plán nenajde, nic neprovede.
 * @param {string} examId - UUID examu, jehož plán chceme odpojit.
 * @param {Object} gqlClient - GraphQL klient.
 * @param {Function} dispatch - Redux dispatch funkce.
 * @returns {Promise<void>}
 */
const unlinkPlanByExamId = async (examId, gqlClient, dispatch) => {
    const result = await dispatch(
        ReadStudyPlanByExamIdAsyncAction({ where: { exam_id: { _eq: examId } }, limit: 1 }, gqlClient)
    )
    const plans = result?.data?.studyPlanPage || result?.studyPlanPage || []
    if (plans.length > 0 && plans[0].id && plans[0].lastchange) {
        await dispatch(UnlinkPlanAction({ id: plans[0].id, lastchange: plans[0].lastchange }, gqlClient))
    }
}

/**
 * Redux thunk akce pro kaskádové smazání examu.
 *
 * Pořadí operací:
 * 1. Načte čerstvá data examu (včetně parts) z API.
 * 2. Pro každý part: odpojí studijní plán (`examId = null`) → smaže part.
 * 3. Odpojí studijní plán rodiče → smaže rodičovský exam.
 *
 * Tímto pořadím se zabrání FK violation na `acclassificationplans.parent_id`
 * a `plans.exam_id`.
 *
 * @param {Object} vars - Proměnné akce.
 * @param {string} vars.id - UUID examu k smazání.
 * @param {string} vars.lastchange - Timestamp poslední změny (fallback pokud API nevrátí čerstvá data).
 * @param {Array<Object>} [vars.parts] - Části examu (fallback pokud API nevrátí čerstvá data).
 * @param {Object} gqlClient - GraphQL klient.
 * @returns {Function} Redux thunk.
 */
export const CascadeDeleteExamAction = (vars, gqlClient) => async (dispatch, getState, next = x => x) => {
    const freshResult = await dispatch(ReadAsyncAction({ id: vars.id }, gqlClient))
    const freshExam = freshResult?.data?.examById || freshResult?.examById || {}
    const parts = freshExam?.parts || vars?.parts || []
    const lastchange = freshExam?.lastchange || vars.lastchange

    for (const part of parts) {
        await unlinkPlanByExamId(part.id, gqlClient, dispatch)
        await dispatch(DeleteAsyncAction({ id: part.id, lastchange: part.lastchange }, gqlClient))
    }

    await unlinkPlanByExamId(vars.id, gqlClient, dispatch)
    return dispatch(DeleteAsyncAction({ id: vars.id, lastchange: lastchange }, gqlClient))
}

const MutationAsyncAction = CascadeDeleteExamAction

/**
 * Odkaz na delete route pro konkrétní exam.
 * Aplikuje RBAC přes `permissions` (role: administrátor).
 * @param {Object} props
 * @param {string} [props.uriPattern=DeleteItemURI] - URI vzor pro delete route.
 * @returns {JSX.Element}
 */
export const DeleteLink = ({
    uriPattern = DeleteItemURI,
    ...props
}) => {
    return (
        <BaseDeleteLink
            {...props}
            uriPattern={uriPattern}
            {...permissions}
        />
    )
}

/**
 * Tlačítko pro smazání examu. Otevře potvrzovací dialog a spustí `CascadeDeleteExamAction`,
 * která před smazáním rodiče smaže všechny parts a odpojí studijní plány.
 * @param {Object} props
 * @param {Function} [props.mutationAsyncAction=CascadeDeleteExamAction] - Akce pro smazání.
 * @param {React.ComponentType} [props.DefaultContent=MediumContent] - Obsah dialogu (read-only).
 * @param {React.ComponentType} [props.Dialog=DeleteDialog] - Dialog komponenta.
 * @param {string} [props.vectorItemsURI=ListURI] - URI pro přesměrování po smazání.
 * @param {Function} [props.onOk] - Callback po úspěšném smazání.
 * @returns {JSX.Element}
 */
export const DeleteButton = ({
    mutationAsyncAction = MutationAsyncAction,
    DefaultContent: DefaultContent_ = DefaultContent,
    Dialog = DeleteDialog,
    vectorItemsURI = ListURI,
    onOk,
    ...props
}) => {
    return (
        <BaseDeleteButton
            {...props}
            DefaultContent={DefaultContent_}
            Dialog={Dialog}
            mutationAsyncAction={mutationAsyncAction}
            vectorItemsURI={vectorItemsURI}
            onOk={onOk}
            {...permissions}
        />
    )
}

/**
 * Potvrzovací dialog pro smazání examu.
 * Používá `CascadeDeleteExamAction` — smaže parts i plány před smazáním rodiče.
 * @param {Object} props
 * @param {Function} [props.mutationAsyncAction=CascadeDeleteExamAction] - Akce pro smazání.
 * @param {React.ComponentType} [props.DefaultContent=MediumContent] - Obsah dialogu (read-only).
 * @param {string} [props.vectorItemsURI=ListURI] - URI pro přesměrování po smazání.
 * @returns {JSX.Element}
 */
export const DeleteDialog = ({
    mutationAsyncAction = MutationAsyncAction,
    DefaultContent: DefaultContent_ = DefaultContent,
    vectorItemsURI = ListURI,
    ...props
}) => {
    return (
        <BaseDeleteDialog
            {...props}
            DefaultContent={DefaultContent_}
            mutationAsyncAction={mutationAsyncAction}
            vectorItemsURI={vectorItemsURI}
            {...permissions}
        />
    )
}

/**
 * Vnitřní tělo delete stránky. Spravuje stav mazání a volá `CascadeDeleteExamAction`.
 * Renderuje se uvnitř `PermissionGate` — přístup pouze pro administrátory.
 * @param {Object} props
 * @param {React.ComponentType} [props.DefaultContent=MediumContent] - Komponenta pro zobrazení examu.
 * @param {string} [props.vectorItemsURI=ListURI] - URI pro přesměrování po smazání.
 * @returns {JSX.Element|null}
 */
const DeleteBodyInner = ({
    DefaultContent: DefaultContent_ = DefaultContent,
    vectorItemsURI = ListURI,
}) => {
    const { allowed } = usePermissionGateContext()
    const navigate = useNavigate()
    const { item, loading: contextLoading } = useGQLEntityContext()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const { run: cascade } = useAsyncThunkAction(MutationAsyncAction, {}, { deferred: true })

    const handleConfirm = useCallback(async () => {
        setSaving(true)
        setError(null)
        try {
            await cascade(item)
            navigate(vectorItemsURI, { replace: true })
        } catch (err) {
            setError(err)
        } finally {
            setSaving(false)
        }
    }, [item, cascade, navigate, vectorItemsURI])

    const handleCancel = () => navigate(-1)
    const isDisabled = saving || contextLoading

    if (!item) return null

    if (!allowed) {
        return (
            <button className="btn btn-warning form-control" onClick={handleCancel} disabled={isDisabled}>
                Nemáte oprávnění
            </button>
        )
    }

    return (
        <DefaultContent_ item={item}>
            <AsyncStateIndicator error={error} loading={saving} text="Odstraňuji" />
            <button className="btn btn-warning form-control" onClick={handleCancel} disabled={isDisabled}>
                Zrušit
            </button>
            <button className="btn btn-primary form-control" onClick={handleConfirm} disabled={isDisabled}>
                {saving ? "Mažu..." : "Smazat"}
            </button>
        </DefaultContent_>
    )
}

/**
 * Page-level delete workflow pro exam.
 * Obaluje `DeleteBodyInner` do `PermissionGate` (role: administrátor).
 * Kaskádově smaže všechny parts a odpojí studijní plány před smazáním rodiče.
 * @param {Object} props
 * @param {React.ComponentType} [props.DefaultContent=MediumContent] - Komponenta pro zobrazení examu.
 * @param {string} [props.vectorItemsURI=ListURI] - URI pro přesměrování po smazání.
 * @returns {JSX.Element}
 */
export const DeleteBody = ({
    DefaultContent: DefaultContent_ = DefaultContent,
    vectorItemsURI = ListURI,
    ...props
}) => {
    return (
        <PermissionGate {...permissions}>
            <DeleteBodyInner
                DefaultContent={DefaultContent_}
                vectorItemsURI={vectorItemsURI}
            />
        </PermissionGate>
    )
}
