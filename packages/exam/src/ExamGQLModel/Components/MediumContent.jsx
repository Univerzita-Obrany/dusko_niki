/**
 * @fileoverview Komponenta pro zobrazení středně detailního obsahu zkoušky.
 * Zobrazuje základní informace o zkoušce včetně názvu, popisu, bodů a semestru.
 * @module ExamGQLModel/Components/MediumContent
 */

import { useMemo } from "react"
import { Link as RouterLink } from "react-router-dom"
import { Link } from "./Link"
// import { MediumContent as MediumContent_} from "../../../../_template/src/Base/Components/MediumContent"
import { Attribute, formatDateTime } from "../../../../_template/src/Base/Components"
import { ReadStudyPlanByIdAsyncAction, ReadStudyPlanByExamIdAsyncAction } from "../Queries"
import { useAsyncThunkAction } from "../../../../dynamic/src/Hooks"

/**
 * Získá planId z položky zkoušky.
 * Hledá planId buď přímo na položce, nebo v jejích částech.
 * @param {Object} item - Položka zkoušky.
 * @param {string} [item.planId] - ID studijního plánu přímo na položce.
 * @param {Array<Object>} [item.parts] - Pole částí zkoušky.
 * @returns {string|null} ID studijního plánu nebo null, pokud není nalezeno.
 */
const getPlanId = (item) => {
    if (item?.planId) {
        return item.planId
    }
    const partWithPlan = item?.parts?.find(part => part?.planId)
    return partWithPlan?.planId || null
}

/**
 * Komponenta pro zobrazení středně detailního obsahu zkoušky.
 * Zobrazuje informace jako název, popis, body, semestr, části a role uživatele.
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Data zkoušky k zobrazení.
 * @param {string} [props.item.name] - Název zkoušky.
 * @param {string} [props.item.nameEn] - Anglický název zkoušky.
 * @param {string} [props.item.description] - Popis zkoušky.
 * @param {string} [props.item.descriptionEn] - Anglický popis zkoušky.
 * @param {number} [props.item.minScore] - Minimální počet bodů.
 * @param {number} [props.item.maxScore] - Maximální počet bodů.
 * @param {Array<Object>} [props.item.parts] - Části zkoušky.
 * @param {React.ReactNode} [props.children] - Dětské komponenty k vykreslení.
 * @returns {JSX.Element} Vykreslená komponenta s detaily zkoušky.
 */
export const MediumContent = ({ item, children}) => {
    const planId = getPlanId(item)

    // Fetch StudyPlan podle planId (když je k dispozici)
    const { data: dataById, loading: loadingById } = useAsyncThunkAction(
        ReadStudyPlanByIdAsyncAction,
        { id: planId },
        { network: !!planId }
    )

    // Fetch StudyPlan podle examId (když není planId) - používá snake_case exam_id
    const examIdQueryVars = useMemo(() => {
        if (planId || !item?.id) return null
        return { where: { exam_id: { _eq: item.id } }, limit: 1 }
    }, [planId, item?.id])

    const { data: dataByExamId, loading: loadingByExamId } = useAsyncThunkAction(
        ReadStudyPlanByExamIdAsyncAction,
        examIdQueryVars,
        { network: !!examIdQueryVars }
    )

    // Extrahuj semester z výsledku - priorita: planId query, pak examId query
    const studyPlanById = dataById?.data?.studyPlanById || dataById?.studyPlanById
    const studyPlansPage = dataByExamId?.data?.studyPlanPage || dataByExamId?.studyPlanPage || []
    const studyPlanByExamId = studyPlansPage.length > 0 ? studyPlansPage[0] : null

    const semester = studyPlanById?.semester || studyPlanByExamId?.semester || null
    const loading = loadingById || loadingByExamId
    return (
        <>
            {item?.name && (
                <Attribute label="Název">
                    <Link item={item} />
                </Attribute>
            )}
            {item?.nameEn && (
                <Attribute label="Anglický název">
                    {item.nameEn}
                </Attribute>
            )}
            {item?.description && (
                <Attribute label="Popis">
                    {item.description}
                </Attribute>
            )}
            {item?.descriptionEn && (
                <Attribute label="Anglický popis">
                    {item.descriptionEn}
                </Attribute>
            )}

                <Attribute label="Minimální počet bodů">
                    {item.minScore}
                </Attribute>

            {item?.maxScore && (
                <Attribute label="Maximální počet bodů">
                    {item.maxScore}
                </Attribute>
            )}
            
            <Attribute label="Semestr">
                {loading ? (
                    <span className="text-muted">Načítám...</span>
                ) : semester ? (
                    <RouterLink
                        to={`/semestr/SemesterGQLModel/view/${semester.id}`}
                        className="text-decoration-none"
                    >
                        {semester.order}. semestr{semester.subject?.name && ` - ${semester.subject.name}`}
                    </RouterLink>
                ) : (
                    <span className="text-muted">Není přiřazen studijní plán</span>
                )}
            </Attribute>
            
            {item?.parent?.id && (
                <Attribute label="Nadřazený exam">
                    <Link item={item.parent}>
                        ← {item.parent.name || item.parent.id}
                    </Link>
                </Attribute>
            )}
            {item?.parts && (
                <Attribute label="Části">
                    {item.parts.map(part => (
                        <Link key={part.id} item={part} className="badge bg-secondary me-1 text-decoration-none">
                            {part.name}
                        </Link>
                    ))}
                </Attribute>
            )}
            {item?.rbacobject?.currentUserRoles?.length > 0 && (
                <Attribute label="Moje role">
                    {item.rbacobject.currentUserRoles.map(role => (
                        <span key={role.id} className="badge bg-secondary me-1">
                    {role.roletype?.name}
                </span>
                    ))}
                </Attribute>
            )}
            <hr />
            {item?.createdby?.fullname && (
                <Attribute label="Vytvořil">
                    {item.createdby.fullname}
                </Attribute>
            )}
            {item?.created && (
                <Attribute label="Vytvořeno">
                    {formatDateTime(item.created)}
                </Attribute>
            )}
            {item?.lastchange && (
                <Attribute label="Změněno">
                    {formatDateTime(item.lastchange)}
                </Attribute>
            )}
            {item?.changedby?.fullname && (
                <Attribute label="Změnil">
                    {item.changedby.fullname}
                </Attribute>
            )}
            {children}
        </>
    )
}