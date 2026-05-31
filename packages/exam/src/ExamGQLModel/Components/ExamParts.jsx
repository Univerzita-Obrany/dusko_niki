import { useState, useCallback } from "react"
import { CardCapsule } from "./CardCapsule"
import { InsertAsyncAction, DeleteAsyncAction } from "../Queries"
import { useAsyncThunkAction } from "../../../../dynamic/src/Hooks"

// Default IDs from system data
const DEFAULT_PLAN_ID = "28c25266-daa4-4579-a32a-7a4394ee463d"
const DEFAULT_TYPE_ID = "a00a0322-b095-11ed-9bd8-0242ac110002"

const DeletePartButton = ({ part }) => {
    const [loading, setLoading] = useState(false)
    const { run } = useAsyncThunkAction(DeleteAsyncAction, {}, { deferred: true })

    const handleDelete = useCallback(async () => {
        if (!confirm(`Opravdu chcete smazat "${part.name}"?`)) {
            return
        }

        setLoading(true)
        try {
            await run({
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
    }, [part, run])

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
    const [maxScore, setMaxScore] = useState(100)
    const [isKlasifikovany, setIsKlasifikovany] = useState(false)

    const { run } = useAsyncThunkAction(InsertAsyncAction, {}, { deferred: true })

    const getPartConfig = () => {
        switch (partType) {
            case "zapocet":
                return isKlasifikovany
                    ? { name: "Klasifikovaný zápočet", nameEn: "Graded Credit" }
                    : { name: "Zápočet", nameEn: "Credit" }
            case "test":
                return { name: "Test", nameEn: "Test" }
            case "zkouska":
                return { name: "Zkouška", nameEn: "Exam" }
            default:
                return { name: "Část", nameEn: "Part" }
        }
    }

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const partConfig = getPartConfig()
            const newPart = {
                id: crypto.randomUUID(),
                name: partConfig.name,
                nameEn: partConfig.nameEn,
                minScore: 0,
                maxScore: parseInt(maxScore, 10) || 100,
                parentId: parentItem?.id,
                planId: parentItem?.planId ?? DEFAULT_PLAN_ID,
                typeId: parentItem?.typeId ?? DEFAULT_TYPE_ID,
            }

            const result = await run(newPart)
            console.log("Created exam part:", result)

            if (onSuccess) {
                onSuccess(result)
            }

            window.location.reload()
        } catch (error) {
            console.error("Failed to create exam part:", error)
            alert("Nepodařilo se vytvořit část zkoušky: " + error.message)
        } finally {
            setLoading(false)
        }
    }, [parentItem, partType, maxScore, isKlasifikovany, run, onSuccess])

    const getTitle = () => {
        switch (partType) {
            case "zapocet": return "Nový Zápočet"
            case "test": return "Nový Test"
            case "zkouska": return "Nová Zkouška"
            default: return "Nová část"
        }
    }

    return (
        <div className="card card-body bg-light mb-3">
            <h6 className="mb-3">{getTitle()}</h6>
            <form onSubmit={handleSubmit}>
                <div className="row g-2 align-items-center">
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

const PartsTable = ({ parts }) => {
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
                    <th style={{ width: "60px" }}></th>
                </tr>
            </thead>
            <tbody>
                {parts.map((part) => (
                    <tr key={part.id}>
                        <td>{part.name}</td>
                        <td>{part.maxScore ?? "-"}</td>
                        <td>{part.minScore ?? "-"}</td>
                        <td>
                            <DeletePartButton part={part} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export const ExamParts = ({ item }) => {
    const parts = item?.parts || []
    const [activeForm, setActiveForm] = useState(null)

    return (
        <CardCapsule item={item} title="Části zkoušky (parts)">
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
                    onClick={() => setActiveForm("test")}
                    disabled={activeForm !== null}
                >
                    + Přidat Test
                </button>
                <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setActiveForm("zkouska")}
                    disabled={activeForm !== null}
                >
                    + Přidat Zkoušku
                </button>
            </div>

            {activeForm && (
                <AddPartForm
                    parentItem={item}
                    partType={activeForm}
                    onCancel={() => setActiveForm(null)}
                />
            )}

            <PartsTable parts={parts} />
        </CardCapsule>
    )
}
