import { useState, useCallback, useEffect } from "react"
import { useLocation } from "react-router"
import { CardCapsule } from "./CardCapsule"
import { Link } from "./Link"
import { InsertAsyncAction, DeleteAsyncAction, UpdateAsyncAction } from "../Queries"
import { useAsyncThunkAction } from "../../../../dynamic/src/Hooks"
import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared"
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2"

const DEFAULT_TYPE_ID = "a00a0322-b095-11ed-9bd8-0242ac110002"
const DEFAULT_PLAN_ID = "28c25266-daa4-4579-a32a-7a4394ee463d"

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

const UnlinkPlanAction = createAsyncGraphQLAction2(createQueryStrLazy(`
mutation UnlinkStudyPlan($id: UUID!, $lastchange: DateTime!) {
  result: studyPlanUpdate(studyPlan: {id: $id, lastchange: $lastchange, examId: null}) {
    ... on StudyPlanGQLModelUpdateError { failed msg }
    ... on StudyPlanGQLModel { id lastchange }
  }
}
`), unlinkPlanMiddleware)

const DeletePartButton = ({ part }) => {
    const [loading, setLoading] = useState(false)
    const { run: deleteExam } = useAsyncThunkAction(DeleteAsyncAction, {}, { deferred: true })
    const { run: unlinkPlan } = useAsyncThunkAction(UnlinkPlanAction, {}, { deferred: true })

    const handleDelete = useCallback(async () => {
        if (!confirm(`Opravdu chcete smazat "${part.name}"?`)) {
            return
        }

        setLoading(true)
        try {
            if (part.plan?.id && part.plan?.lastchange) {
                await unlinkPlan({ id: part.plan.id, lastchange: part.plan.lastchange })
            }
            await deleteExam({
                id: part.id,
                lastchange: part.lastchange
            })
            window.location.reload()
        } catch (error) {
            console.error("Failed to delete exam part:", error)
            alert("Nepodařilo se smazat část zkoušky: " + error.message)
        } finally {
            setLoading(false)
        }
    }, [part, deleteExam, unlinkPlan])

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
            const newPart = {
                id: crypto.randomUUID(),
                name: name.trim() || partConfig.name,
                nameEn: partConfig.nameEn,
                description: description.trim(),
                minScore: parseInt(minScore, 10) || 0,
                maxScore: parseInt(maxScore, 10) || 100,
                parentId: parentItem?.id,
                typeId: parentItem?.typeId ?? DEFAULT_TYPE_ID,
                planId: DEFAULT_PLAN_ID,
            }

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

export const ExamParts = ({ item }) => {
    const parts = item?.parts || []
    const [activeForm, setActiveForm] = useState(null)
    const [showOtherOptions, setShowOtherOptions] = useState(false)
    const { pathname } = useLocation()
    const showActions = pathname.includes("/edit/")

    return (
        <CardCapsule item={item} title="Části zkoušky (parts)">
            {showActions && (
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

            {showActions && showOtherOptions && activeForm === null && (
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

            {showActions && activeForm && (
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