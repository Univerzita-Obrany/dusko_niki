/**
 * @fileoverview Komponenta pro správu částí zkoušky (parts).
 * Umožňuje zobrazení, přidávání, editaci a mazání částí zkoušky jako jsou zápočty, testy a zkoušky.
 * @module ExamGQLModel/Components/ExamParts
 */

import { useState, useCallback, useEffect } from "react"
import { useLocation } from "react-router"
import { CardCapsule } from "./CardCapsule"
import { Link } from "./Link"
import { InsertAsyncAction, DeleteAsyncAction, UpdateAsyncAction, ReadStudyPlanByExamIdAsyncAction } from "../Queries"
import { useAsyncThunkAction } from "../../../../dynamic/src/Hooks"
import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared"
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2"

/**
 * Výchozí ID typu zkoušky z databáze (acclassificationtypes).
 * @constant {string}
 */
const DEFAULT_TYPE_ID = "a00a0322-b095-11ed-9bd8-0242ac110002"

/**
 * Generuje náhodné UUID v4 formátu.
 * @returns {string} Vygenerované UUID.
 */
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Získá planId z rodičovského examu nebo z jeho částí.
 * @param {Object} parentItem - Rodičovská položka zkoušky.
 * @param {string} [parentItem.planId] - ID studijního plánu na rodičovské položce.
 * @param {Array<Object>} [parentItem.parts] - Pole částí rodičovské zkoušky.
 * @returns {string|null} ID studijního plánu nebo null, pokud není k dispozici.
 */
const getPlanIdFromParent = (parentItem) => {
    // Pokud má parent vlastní planId, použij ho
    if (parentItem?.planId) {
        return parentItem.planId
    }
    // Jinak zkus najít planId v existujících částech
    const partWithPlan = parentItem?.parts?.find(part => part?.planId)
    if (partWithPlan?.planId) {
        return partWithPlan.planId
    }
    // Žádný planId není k dispozici - backend ho nevyžaduje
    return null
}

/**
 * Middleware pro zpracování výsledku odpojení studijního plánu.
 * V případě neúspěchu vyhodí chybu s detaily o selhání.
 * @param {Object} result - Výsledek z GraphQL mutace.
 * @returns {Function} Asynchronní funkce, která zpracovává řetězec middleware.
 */
const unlinkPlanMiddleware = (result) => async (dispatch, getState, next) => {
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
 * GraphQL akce pro přesměrování studijního plánu na jiný exam.
 * Při mazání partu nastaví `examId` na rodičovský exam (ne null),
 * aby rodičovský exam nepřišel o propojení se semestrem.
 * @type {Function}
 * @param {Object} vars
 * @param {string} vars.id - UUID studijního plánu.
 * @param {string} vars.lastchange - Timestamp poslední změny plánu.
 * @param {string|null} vars.examId - UUID examu, na který se plán přesměruje (typicky parentId partu).
 */
const ReassignPlanAction = createAsyncGraphQLAction2(createQueryStrLazy(`
mutation ReassignStudyPlan($id: UUID!, $lastchange: DateTime!, $examId: UUID) {
  result: studyPlanUpdate(studyPlan: {id: $id, lastchange: $lastchange, examId: $examId}) {
    ... on StudyPlanGQLModelUpdateError { failed msg }
    ... on StudyPlanGQLModel { id lastchange }
  }
}
`), unlinkPlanMiddleware)

/**
 * Tlačítko pro smazání části zkoušky (part/exampart).
 *
 * Před smazáním partu:
 * 1. Načte studijní plán propojený s tímto partem (přes `exam_id = part.id`).
 * 2. Přesměruje plán na rodičovský exam (`examId = part.parentId`), aby rodič nepřišel o semestr.
 * 3. Smaže part.
 * 4. Provede reload stránky.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.part - Část zkoušky, která má být smazána.
 * @param {string} props.part.id - UUID části.
 * @param {string} props.part.name - Název části (použit v confirm dialogu).
 * @param {string} props.part.lastchange - Timestamp poslední změny části.
 * @param {string} [props.part.parentId] - UUID rodičovského examu (pro přesměrování plánu).
 * @returns {JSX.Element} Tlačítko pro smazání části.
 */
const DeletePartButton = ({ part }) => {
    const [loading, setLoading] = useState(false)
    const { run: deleteExam } = useAsyncThunkAction(DeleteAsyncAction, {}, { deferred: true })
    const { run: reassignPlan } = useAsyncThunkAction(ReassignPlanAction, {}, { deferred: true })
    const { run: fetchPlan } = useAsyncThunkAction(ReadStudyPlanByExamIdAsyncAction, {}, { deferred: true })

    const handleDelete = useCallback(async () => {
        if (!confirm(`Opravdu chcete smazat "${part.name}"?`)) {
            return
        }

        setLoading(true)
        try {
            // Fetch the study plan linked to this part via examId
            const planResult = await fetchPlan({ where: { exam_id: { _eq: part.id } }, limit: 1 })
            const plans = planResult?.data?.studyPlanPage || planResult?.studyPlanPage || []
            if (plans.length > 0 && plans[0].id && plans[0].lastchange) {
                // Reassign plan to parent exam (not null) to keep parent's semester connection
                await reassignPlan({
                    id: plans[0].id,
                    lastchange: plans[0].lastchange,
                    examId: part.parentId ?? null,
                })
            }
            await deleteExam({ id: part.id, lastchange: part.lastchange })
            window.location.reload()
        } catch (error) {
            console.error("Failed to delete exam part:", error)
            alert("Nepodařilo se smazat část zkoušky: " + error.message)
        } finally {
            setLoading(false)
        }
    }, [part, deleteExam, reassignPlan, fetchPlan])

    return (
        <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleDelete}
            disabled={loading}
            title="Smazat"
        >
            {loading ? "..." : "✕"}
        </button>
    )
}

/**
 * Formulář pro přidání nové části zkoušky.
 * Zobrazuje vstupní pole pro název, minimální a maximální body, popis.
 * Pro typ "zapocet" umožňuje volbu klasifikovaného zápočtu.
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.parentItem - Nadřazená položka zkoušky.
 * @param {string} props.parentItem.id - ID nadřazené zkoušky.
 * @param {string} [props.parentItem.typeId] - ID typu zkoušky.
 * @param {string} [props.parentItem.planId] - ID studijního plánu.
 * @param {string} props.partType - Typ přidávané části ("zapocet", "test", "zkouska", "jine").
 * @param {Function} props.onCancel - Callback funkce pro zrušení formuláře.
 * @param {Function} [props.onSuccess] - Callback funkce volaná při úspěšném vytvoření.
 * @returns {JSX.Element} Formulář pro vytvoření nové části.
 */
const AddPartForm = ({ parentItem, partType, onCancel, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [minScore, setMinScore] = useState(0)
    const [maxScore, setMaxScore] = useState(100)
    const [description, setDescription] = useState("")
    const [isKlasifikovany, setIsKlasifikovany] = useState(false)

    const { run } = useAsyncThunkAction(InsertAsyncAction, {}, { deferred: true })

    const getPartConfig = useCallback(() => {
        switch (partType) {
            case "zapocet":
                return isKlasifikovany
                    ? { name: "Klasifikovaný zápočet", nameEn: "Graded Credit" }
                    : { name: "Zápočet", nameEn: "Credit" }
            case "test":
                return { name: "Test", nameEn: "Test" }
            case "zkouska":
                return { name: "Zkouška", nameEn: "Exam" }
            case "jine":
                return { name: "Jiná část", nameEn: "Other Part" }
            default:
                return { name: "Část", nameEn: "Part" }
        }
    }, [partType, isKlasifikovany])

    useEffect(() => {
        const partConfig = getPartConfig()
        setName(partConfig.name)
        setMinScore(0)
        setMaxScore(100)
        setDescription("")
    }, [getPartConfig])

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const partConfig = getPartConfig()
            // Získej planId z rodičovského examu nebo jeho částí
            const planId = getPlanIdFromParent(parentItem)

            const generatedId = generateUUID()
            console.log("Generated UUID:", generatedId)

            const newPart = {
                id: generatedId,
                name: name.trim() || partConfig.name,
                nameEn: partConfig.nameEn,
                description: description.trim(),
                minScore: parseInt(minScore, 10) || 0,
                maxScore: parseInt(maxScore, 10) || 100,
                parentId: parentItem?.id,
                typeId: parentItem?.typeId ?? DEFAULT_TYPE_ID,
                planId: planId,
            }

            console.log("Creating exam part with:", newPart)
            console.log("newPart.id:", newPart.id, "typeof:", typeof newPart.id)
            const result = await run(newPart)
            console.log("Created exam part:", result)

            if (onSuccess) {
                onSuccess(result)
            }

            window.location.reload()
        } catch (error) {
            const details = error.errors
                ? JSON.stringify(error.errors, null, 2)
                : error.message
            console.error("Failed to create exam part:", error, error.errors)
            alert("Nepodařilo se vytvořit část zkoušky:\n" + details)
        } finally {
            setLoading(false)
        }
    }, [parentItem, partType, name, minScore, maxScore, description, isKlasifikovany, run, onSuccess, getPartConfig])

    const getTitle = () => {
        switch (partType) {
            case "zapocet": return "Nový Zápočet"
            case "test": return "Nový Test"
            case "zkouska": return "Nová Zkouška"
            case "jine": return "Nová Jiná část"
            default: return "Nová část"
        }
    }

    return (
        <div className="card card-body bg-light mb-3">
            <h6 className="mb-3">{getTitle()}</h6>
            <form onSubmit={handleSubmit}>
                <div className="row g-2 align-items-center">
                    <div className="col-12">
                        <label className="col-form-label">Jméno:</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jméno části"
                        />
                    </div>

                    <div className="col-auto">
                        <label className="col-form-label">Min bodů:</label>
                    </div>
                    <div className="col-auto">
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            value={minScore}
                            onChange={(e) => setMinScore(e.target.value)}
                            min="0"
                            max="1000"
                            style={{ width: "80px" }}
                        />
                    </div>

                    <div className="col-auto">
                        <label className="col-form-label">Max bodů:</label>
                    </div>
                    <div className="col-auto">
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value)}
                            min="1"
                            max="1000"
                            style={{ width: "80px" }}
                        />
                    </div>

                    {partType === "zapocet" && (
                        <div className="col-auto">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="klasifikovany"
                                    checked={isKlasifikovany}
                                    onChange={(e) => setIsKlasifikovany(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="klasifikovany">
                                    Klasifikovaný zápočet
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="col-12">
                        <label className="col-form-label">Popis:</label>
                        <textarea
                            className="form-control form-control-sm"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Popis části"
                        />
                    </div>

                    <div className="col-auto">
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={loading}
                        >
                            {loading ? "Vytvářím..." : "Vytvořit"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm ms-1"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Zrušit
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

/**
 * Tabulková komponenta pro zobrazení seznamu částí zkoušky.
 * Zobrazuje název, maximální a minimální body pro každou část.
 * Pokud je povoleno showActions, zobrazuje také tlačítka pro editaci a mazání.
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Array<Object>} props.parts - Seznam částí zkoušky k zobrazení.
 * @param {string} props.parts[].id - Jedinečný identifikátor části.
 * @param {string} props.parts[].name - Název části.
 * @param {number} props.parts[].minScore - Minimální počet bodů.
 * @param {number} props.parts[].maxScore - Maximální počet bodů.
 * @param {boolean} [props.showActions=false] - Zda zobrazit tlačítka akcí (editace, smazání).
 * @returns {JSX.Element} Tabulka s částmi zkoušky nebo zpráva o prázdném seznamu.
 */
const PartsTable = ({ parts, showActions = false }) => {
    if (!parts || parts.length === 0) {
        return <p className="text-muted">Zatím nejsou přidány žádné části.</p>
    }

    return (
        <table className="table table-sm table-hover">
            <thead>
                <tr>
                    <th>Název</th>
                    <th>Max bodů</th>
                    <th>Min bodů</th>
                    {showActions && <th style={{ width: "60px" }}></th>}
                </tr>
            </thead>
            <tbody>
                {parts.map((part) => (
                    <tr key={part.id}>
                        <td>
                            <InlineEditCell part={part} field="name" editable={showActions} />
                        </td>
                        <td>
                            <InlineEditCell part={part} field="maxScore" type="number" editable={showActions} />
                        </td>
                        <td>
                            <InlineEditCell part={part} field="minScore" type="number" editable={showActions} />
                        </td>
                        {showActions && (
                            <td>
                                <DeletePartButton part={part} />
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

/**
 * Buňka tabulky, která umožňuje inline editaci pole.
 * V needitovatelném režimu zobrazuje hodnotu jako link (pro pole "name") nebo prostý text.
 * V editovatelném režimu po kliknutí zobrazí vstupní pole s tlačítky pro uložení/zrušení.
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.part - Data části zkoušky pro daný řádek.
 * @param {string} props.part.id - Jedinečný identifikátor části.
 * @param {string} props.part.lastchange - Timestamp poslední změny.
 * @param {string} props.field - Pole části, které se má zobrazit/editovat.
 * @param {string} [props.type="text"] - Typ vstupu pro editaci ("text" nebo "number").
 * @param {boolean} [props.editable=false] - Zda je buňka editovatelná.
 * @returns {JSX.Element} Buňka tabulky s možností inline editace.
 */
const InlineEditCell = ({ part, field, type = "text", editable = false }) => {
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(part[field] ?? (type === "number" ? 0 : ""))
    const [loading, setLoading] = useState(false)
    const { run } = useAsyncThunkAction(UpdateAsyncAction, {}, { deferred: true })

    const handleSave = useCallback(async () => {
        setLoading(true)
        try {
            await run({
                id: part.id,
                lastchange: part.lastchange,
                [field]: type === "number" ? (parseInt(value, 10) || 0) : value,
            })
            setEditing(false)
        } catch (error) {
            console.error("Failed to update exam part:", error)
            alert("Nepodařilo se upravit část zkoušky: " + error.message)
        } finally {
            setLoading(false)
        }
    }, [part, field, type, value, run])

    if (!editable) {
        if (field === "name") {
            return <Link item={part} />
        }

        return <span>{part[field] ?? "-"}</span>
    }

    if (editing) {
        return (
            <div className="d-flex gap-1 align-items-center">
                <input
                    autoFocus
                    type={type}
                    className="form-control form-control-sm"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    style={type === "number" ? { width: "90px" } : undefined}
                />
                <button className="btn btn-success btn-sm" type="button" onClick={handleSave} disabled={loading}>
                    {loading ? "..." : "✓"}
                </button>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(false)} disabled={loading}>
                    ✕
                </button>
            </div>
        )
    }

    return (
        <button className="btn btn-link btn-sm p-0 text-decoration-none" type="button" onClick={() => setEditing(true)}>
            {part[field] ?? "-"}
        </button>
    )
}

/**
 * Hlavní komponenta pro zobrazení a správu částí zkoušky.
 * Umožňuje přidávat nové části (zápočet, zkouška, test, jiné),
 * upravovat existující části inline a mazat je.
 * Před přidáním částí vyžaduje, aby byl přiřazen semestr.
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Hlavní položka zkoušky obsahující její části.
 * @param {string} props.item.id - Jedinečný identifikátor zkoušky.
 * @param {string} [props.item.planId] - ID přiřazeného studijního plánu.
 * @param {Array<Object>} [props.item.parts] - Pole částí zkoušky.
 * @returns {JSX.Element} Karta s tabulkou částí a tlačítky pro správu.
 */
export const ExamParts = ({ item }) => {
    const parts = item?.parts || []
    const [activeForm, setActiveForm] = useState(null)
    const [showOtherOptions, setShowOtherOptions] = useState(false)
    const { pathname } = useLocation()
    const showActions = pathname.includes("/edit/")

    // Zkontroluj jestli má exam přiřazený semestr (přes planId nebo parts s planId)
    const hasSemester = item?.planId || parts.some(part => part?.planId)

    return (
        <CardCapsule item={item} title="Části zkoušky (parts)">
            {showActions && !hasSemester && (
                <div className="alert alert-warning mb-3" role="alert">
                    <strong>⚠️ Není přiřazen semestr!</strong>
                    <p className="mb-0 mt-1">Pro přidání částí zkoušky musíte nejprve vybrat semestr v poli "Semestr" níže.</p>
                </div>
            )}

            {showActions && hasSemester && (
                <div className="mb-3">
                    <button
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => setActiveForm("zapocet")}
                        disabled={activeForm !== null}
                    >
                        + Přidat Zápočet
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => setActiveForm("zkouska")}
                        disabled={activeForm !== null}
                    >
                        + Přidat Zkoušku
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setShowOtherOptions((current) => !current)}
                        disabled={activeForm !== null}
                    >
                        + Přidat jiné
                    </button>
                </div>
            )}

            {showActions && hasSemester && showOtherOptions && activeForm === null && (
                <div className="card card-body bg-light mb-3">
                    <div className="d-flex gap-2 flex-wrap">
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                                setActiveForm("test")
                                setShowOtherOptions(false)
                            }}
                            type="button"
                        >
                            Test
                        </button>
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                                setActiveForm("jine")
                                setShowOtherOptions(false)
                            }}
                            type="button"
                        >
                            Jiná část
                        </button>
                    </div>
                </div>
            )}

            {showActions && hasSemester && activeForm && (
                <AddPartForm
                    parentItem={item}
                    partType={activeForm}
                    onCancel={() => setActiveForm(null)}
                />
            )}

            <PartsTable parts={parts} showActions={showActions} />
        </CardCapsule>
    )
}