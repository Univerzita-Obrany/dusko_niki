/**
 * @fileoverview Komponenta pro výběr semestru a jeho propojení se zkouškou.
 * Umožňuje uživateli vybrat semestr ze seznamu studijních plánů
 * a automaticky propojí vybraný plán se zkouškou.
 * @module ExamGQLModel/Components/SemesterSelect
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared"
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2"
import { useAsyncThunkAction } from "../../../../dynamic/src/Hooks"
import { Label } from "../../../../_template/src/Base/FormControls/Label"

/**
 * GraphQL query pro načtení stránkovaného seznamu studijních plánů se semestry.
 * @constant {string}
 */
const StudyPlansQueryStr = `
query studyPlanPage($skip: Int, $limit: Int) {
  studyPlanPage(skip: $skip, limit: $limit) {
    __typename
    id
    lastchange
    examId
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
 * GraphQL query pro načtení studijního plánu propojeného s konkrétním examem.
 * @constant {string}
 */
const StudyPlanByExamIdQueryStr = `
query studyPlanByExamId($skip: Int, $limit: Int, $where: StudyPlanInputFilter) {
  studyPlanPage(skip: $skip, limit: $limit, where: $where) {
    __typename
    id
    lastchange
    examId
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
 * GraphQL query pro načtení jednoho studijního plánu podle ID.
 * @constant {string}
 */
const StudyPlanByIdQueryStr = `
query studyPlanById($id: UUID!) {
  studyPlanById(id: $id) {
    __typename
    id
    lastchange
    examId
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
 * GraphQL mutace pro aktualizaci studijního plánu (propojení s examem).
 * @constant {string}
 */
const UpdateStudyPlanMutationStr = `
mutation studyPlanUpdate($id: UUID!, $lastchange: DateTime!, $examId: UUID) {
  studyPlanUpdate(studyPlan: {id: $id, lastchange: $lastchange, examId: $examId}) {
    ... on StudyPlanGQLModel {
      __typename
      id
      lastchange
      examId
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
    ... on StudyPlanGQLModelUpdateError {
      __typename
      msg
      failed
    }
  }
}
`

/**
 * GraphQL mutace pro aktualizaci planId u zkoušky.
 * @constant {string}
 */
const UpdateExamPlanIdMutationStr = `
mutation examUpdate($id: UUID!, $lastchange: DateTime!, $planId: UUID) {
  examUpdate(exam: {id: $id, lastchange: $lastchange, planId: $planId}) {
    ... on ExamGQLModel {
      __typename
      id
      lastchange
      planId
    }
    ... on ExamGQLModelUpdateError {
      __typename
      msg
      failed
    }
  }
}
`

/**
 * GraphQL mutace pro aktualizaci názvu zkoušky.
 * @constant {string}
 */
const UpdateExamNameMutationStr = `
mutation examUpdateName($id: UUID!, $lastchange: DateTime!, $name: String, $nameEn: String) {
  examUpdate(exam: {id: $id, lastchange: $lastchange, name: $name, nameEn: $nameEn}) {
    ... on ExamGQLModel {
      __typename
      id
      lastchange
      name
      nameEn
    }
    ... on ExamGQLModelUpdateError {
      __typename
      msg
      failed
    }
  }
}
`

/**
 * Lazy-loaded GraphQL query pro studijní plány.
 * @type {Function}
 */
const StudyPlansQuery = createQueryStrLazy(StudyPlansQueryStr)

/**
 * Lazy-loaded GraphQL query pro studijní plán podle examId.
 * @type {Function}
 */
const StudyPlanByExamIdQuery = createQueryStrLazy(StudyPlanByExamIdQueryStr)

/**
 * Lazy-loaded GraphQL query pro studijní plán podle ID.
 * @type {Function}
 */
const StudyPlanByIdQuery = createQueryStrLazy(StudyPlanByIdQueryStr)

/**
 * Lazy-loaded GraphQL mutace pro aktualizaci studijního plánu.
 * @type {Function}
 */
const UpdateStudyPlanMutation = createQueryStrLazy(UpdateStudyPlanMutationStr)

/**
 * Lazy-loaded GraphQL mutace pro aktualizaci planId zkoušky.
 * @type {Function}
 */
const UpdateExamPlanIdMutation = createQueryStrLazy(UpdateExamPlanIdMutationStr)

/**
 * Lazy-loaded GraphQL mutace pro aktualizaci názvu zkoušky.
 * @type {Function}
 */
const UpdateExamNameMutation = createQueryStrLazy(UpdateExamNameMutationStr)

/**
 * Asynchronní akce pro načtení studijních plánů.
 * @type {Function}
 */
const FetchStudyPlansAction = createAsyncGraphQLAction2(StudyPlansQuery)

/**
 * Asynchronní akce pro načtení studijního plánu podle examId.
 * @type {Function}
 */
const FetchStudyPlanByExamIdAction = createAsyncGraphQLAction2(StudyPlanByExamIdQuery)

/**
 * Asynchronní akce pro načtení studijního plánu podle ID.
 * @type {Function}
 */
const FetchStudyPlanByIdAction = createAsyncGraphQLAction2(StudyPlanByIdQuery)

/**
 * Asynchronní akce pro aktualizaci studijního plánu.
 * @type {Function}
 */
const UpdateStudyPlanAction = createAsyncGraphQLAction2(UpdateStudyPlanMutation)

/**
 * Asynchronní akce pro aktualizaci planId zkoušky.
 * @type {Function}
 */
const UpdateExamPlanIdAction = createAsyncGraphQLAction2(UpdateExamPlanIdMutation)

/**
 * Asynchronní akce pro aktualizaci názvu zkoušky.
 * @type {Function}
 */
const UpdateExamNameAction = createAsyncGraphQLAction2(UpdateExamNameMutation)

/**
 * Komponenta pro výběr semestru a propojení se zkouškou.
 * Zobrazuje select s dostupnými studijními plány a umožňuje jejich výběr.
 *
 * Chování při editaci existujícího examu (má lastchange):
 * - Odpojí starý studijní plán od zkoušky
 * - Propojí nový studijní plán se zkouškou
 * - Aktualizuje název zkoušky podle předmětu
 * - Aktualizuje planId u všech částí zkoušky
 *
 * Chování při vytváření nového examu (nemá lastchange):
 * - Pouze uloží vybraný planId do draftu přes onChange
 * - Propojení se provede až po vytvoření examu
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Data zkoušky.
 * @param {string} props.item.id - Jedinečný identifikátor zkoušky.
 * @param {string} [props.item.lastchange] - Timestamp poslední změny (undefined při vytváření).
 * @param {Array<Object>} [props.item.parts] - Části zkoušky.
 * @param {Function} [props.onChange] - Callback pro změnu hodnoty při vytváření (draft mode).
 * @param {Function} [props.onUpdate] - Callback volaný po úspěšné aktualizaci.
 * @returns {JSX.Element} Select element pro výběr semestru.
 */
export const SemesterSelect = ({ item, onChange, onUpdate }) => {
    // Stav indikující, zda probíhá ukládání změn
    const [saving, setSaving] = useState(false)

    // Aktuálně vybraný ID studijního plánu
    const [selectedPlanId, setSelectedPlanId] = useState(null)

    // Detekce režimu vytváření nového examu.
    // Pokud item nemá lastchange, znamená to, že ještě není uložen v databázi.
    // V tomto režimu komponenta pouze ukládá vybranou hodnotu do draftu přes onChange,
    // místo okamžitého volání GraphQL mutací.
    const isCreateMode = !item?.lastchange

    // Fetch všechny StudyPlans
    const { data: allPlansData, loading: loadingAll } = useAsyncThunkAction(
        FetchStudyPlansAction,
        { limit: 100 },
        { network: true }
    )

    // Fetch aktuální StudyPlan propojený s tímto examem (pouze v edit mode)
    const examIdQueryVars = useMemo(() => {
        if (isCreateMode || !item?.id) return null
        return { where: { exam_id: { _eq: item.id } }, limit: 1 }
    }, [isCreateMode, item?.id])

    const { data: currentPlanData, loading: loadingCurrent } = useAsyncThunkAction(
        FetchStudyPlanByExamIdAction,
        examIdQueryVars,
        { network: !!examIdQueryVars }
    )

    const { run: updateStudyPlan } = useAsyncThunkAction(
        UpdateStudyPlanAction,
        {},
        { deferred: true }
    )

    const { run: updateExamPlanId } = useAsyncThunkAction(
        UpdateExamPlanIdAction,
        {},
        { deferred: true }
    )

    const { run: updateExamName } = useAsyncThunkAction(
        UpdateExamNameAction,
        {},
        { deferred: true }
    )

    const { run: fetchStudyPlanById } = useAsyncThunkAction(
        FetchStudyPlanByIdAction,
        {},
        { deferred: true }
    )

    // Extrahuj data
    const allPlans = allPlansData?.data?.studyPlanPage || allPlansData?.studyPlanPage || []
    const currentPlans = currentPlanData?.data?.studyPlanPage || currentPlanData?.studyPlanPage || []
    const currentPlan = currentPlans.length > 0 ? currentPlans[0] : null

    // Nastav vybraný plan při načtení
    useEffect(() => {
        if (currentPlan?.id && !selectedPlanId) {
            setSelectedPlanId(currentPlan.id)
        }
    }, [currentPlan?.id, selectedPlanId])

    /**
     * Handler pro změnu výběru semestru.
     *
     * V režimu vytváření (isCreateMode = true):
     * - Pouze uloží vybraný planId do draftu přes onChange callback
     * - Simuluje event objekt kompatibilní s ostatními form handlery
     *
     * V režimu editace (isCreateMode = false):
     * - Odpojí předchozí studijní plán od examu
     * - Načte čerstvá data nového plánu pro aktuální lastchange
     * - Propojí nový studijní plán s examem
     * - Automaticky aktualizuje název examu podle předmětu
     * - Aktualizuje planId u všech částí (parts) examu
     * - Provede reload stránky nebo zavolá onUpdate callback
     *
     * @param {Event} e - Událost změny select elementu.
     * @returns {Promise<void>}
     */
    const handleChange = useCallback(async (e) => {
        const newPlanId = e.target.value || null
        setSelectedPlanId(newPlanId)

        // V create mode pouze uložíme planId do draftu přes onChange
        if (isCreateMode) {
            if (onChange) {
                // Simulujeme event pro onChange handler
                onChange({ target: { id: "planId", value: newPlanId } })
            }
            return
        }

        if (!item?.id) return

        setSaving(true)
        try {
            // Odpoj starý StudyPlan (pokud existuje)
            if (currentPlan && currentPlan.id !== newPlanId) {
                await updateStudyPlan({
                    id: currentPlan.id,
                    lastchange: currentPlan.lastchange,
                    examId: null
                })
            }

            // Propoj nový StudyPlan s hlavním examem a nastav název
            if (newPlanId) {
                // Načti čerstvá data pro studijní plán s aktuálním lastchange
                const freshPlanData = await fetchStudyPlanById({ id: newPlanId })
                const freshPlan = freshPlanData?.data?.studyPlanById || freshPlanData?.studyPlanById

                if (freshPlan) {
                    await updateStudyPlan({
                        id: freshPlan.id,
                        lastchange: freshPlan.lastchange,
                        examId: item.id
                    })

                    // Použij semester z čerstvých dat
                    const newPlan = freshPlan

                    // Automaticky nastav název examu na "Subject name - hodnocení"
                    const subjectName = newPlan.semester?.subject?.name
                    if (subjectName && item?.lastchange) {
                        const newName = `${subjectName} - hodnocení`
                        const newNameEn = `${subjectName} - evaluation`
                        try {
                            await updateExamName({
                                id: item.id,
                                lastchange: item.lastchange,
                                name: newName,
                                nameEn: newNameEn
                            })
                            console.log(`Updated exam name to: ${newName}`)
                        } catch (nameError) {
                            console.error("Failed to update exam name:", nameError)
                        }
                    }
                } else {
                    console.error("Failed to fetch fresh study plan data for id:", newPlanId)
                }
            }

            // Aktualizuj planId u všech částí (parts)
            const parts = item?.parts || []
            for (const part of parts) {
                if (part?.id && part?.lastchange) {
                    try {
                        await updateExamPlanId({
                            id: part.id,
                            lastchange: part.lastchange,
                            planId: newPlanId
                        })
                        console.log(`Updated part ${part.name} planId to ${newPlanId}`)
                    } catch (partError) {
                        console.error(`Failed to update part ${part.name}:`, partError)
                    }
                }
            }

            // Refresh stránky pro zobrazení změn
            if (onUpdate) {
                onUpdate()
            } else {
                window.location.reload()
            }
        } catch (error) {
            console.error("Failed to update semester link:", error)
            alert("Nepodařilo se změnit semestr: " + error.message)
        } finally {
            setSaving(false)
        }
    }, [isCreateMode, onChange, item?.id, item?.lastchange, item?.parts, currentPlan, updateStudyPlan, updateExamPlanId, updateExamName, fetchStudyPlanById, onUpdate])

    /**
     * Formátuje popisek studijního plánu pro zobrazení v select option.
     * @param {Object} plan - Studijní plán.
     * @param {Object} [plan.semester] - Semestr přiřazený k plánu.
     * @param {number} [plan.semester.order] - Pořadí semestru.
     * @param {Object} [plan.semester.subject] - Předmět přiřazený k semestru.
     * @returns {string} Formátovaný popisek (např. "1. semestr - Matematika").
     */
    const formatPlanLabel = (plan) => {
        const semester = plan?.semester
        if (!semester) return `StudyPlan ${plan.id.slice(0, 8)}...`
        const subjectName = semester.subject?.name || ""
        return `${semester.order}. semestr${subjectName ? ` - ${subjectName}` : ""}`
    }

    const loading = loadingAll || loadingCurrent

    return (
        <Label id="semester" title="Semestr">
            <select
                id="semester"
                className="form-select"
                value={selectedPlanId || ""}
                onChange={handleChange}
                disabled={loading || saving}
            >
                <option value="">
                    {loading ? "Načítám..." : saving ? "Ukládám..." : "-- Vyberte semestr --"}
                </option>
                {allPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                        {formatPlanLabel(plan)}
                        {plan.examId && plan.examId !== item?.id ? " (obsazeno)" : ""}
                    </option>
                ))}
            </select>
        </Label>
    )
}
