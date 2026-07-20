
import { ReadPageAsyncAction } from "../Queries"
import { useInfiniteScroll } from "../../../../dynamic/src/Hooks/useInfiniteScroll"
import { PageBase } from "./PageBase"
import { Table } from "../Components/Table"
import { Filter } from "../Components/Filter"
import { FilterButton, ResetFilterButton } from "../../../../_template/src/Base/FormControls/Filter"
import { useSearchParams } from "react-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AsyncStateIndicator } from "../../../../_template/src/Base/Helpers/AsyncStateIndicator"
import { Collapsible } from "../../../../_template/src/Base/FormControls/Collapsible"
import { CreateButton } from "../Mutations/Create"


function safeParseWhere(sp, paramName = "where") {
    const raw = sp.get(paramName);
    if (!raw) return null;
    try {
        const obj = JSON.parse(raw);
        return obj && typeof obj === "object" ? obj : null;
    } catch {
        return null;
    }
}

const COLUMN_TO_DB_FIELD = {
    name: "name",
    nameEn: "name_en",
    minScore: "min_score",
    maxScore: "max_score",
    changed: "lastchange",
}

const computeOrderby = (sortConfig) => {
    if (!sortConfig.column || !sortConfig.direction) return undefined
    const field = COLUMN_TO_DB_FIELD[sortConfig.column]
    if (!field) return undefined
    return sortConfig.direction === "desc" ? `-${field}` : field
}

const filterParameterName = "gr_where"
export const PageVector = ({ children, queryAsyncAction = ReadPageAsyncAction }) => {

    const [sp] = useSearchParams();
    const [sortConfig, setSortConfig] = useState({ column: null, direction: null })

    const whereFromUrl = useMemo(() => safeParseWhere(sp, filterParameterName), [sp.toString()]);

    const { items, loading, error, hasMore, sentinelRef, loadMore, restart } = useInfiniteScroll(
        {
            asyncAction: queryAsyncAction,
            actionParams: { skip: 0, limit: 25, where: whereFromUrl },
        }
    )

    useEffect(() => {
        const orderby = computeOrderby(sortConfig)
        const params = { skip: 0, limit: 25, where: whereFromUrl, ...(orderby && { orderby }) }
        restart(params)
    }, [whereFromUrl, sortConfig]);

    const handleSort = useCallback((column) => {
        setSortConfig(prev => {
            if (prev.column !== column) return { column, direction: "asc" }
            if (prev.direction === "asc") return { column, direction: "desc" }
            return { column: null, direction: null }
        })
    }, [])

    return (
        <PageBase>
            <Collapsible
                className="form-control btn btn-outline-primary"
                buttonLabelCollapsed="Zobrazit filtr"
                buttonLabelExpanded="Skrýt filtr"
            >
                <Filter>
                    <FilterButton
                        className="form-control btn btn-outline-success"
                        paramName={filterParameterName}
                    >
                        Filtrovat
                    </FilterButton>
                    <ResetFilterButton
                        className="form-control btn btn-warning"
                        paramName={filterParameterName}
                    >
                        Vymazat filtr
                    </ResetFilterButton>
                </Filter>
            </Collapsible>

        <div className="d-flex justify-content-center gap-5 mb-4 mt-4">
                <CreateButton className="btn btn-outline-success" rbacitem={{}}>Přidat</CreateButton>
            </div>

            <Table data={items} sortConfig={sortConfig} onSort={handleSort} />

            <AsyncStateIndicator error={error} loading={loading} text="Nahrávám další..." />

            {hasMore && <div ref={sentinelRef} style={{ height: 80, backgroundColor: "lightgray" }} />}
            {hasMore && <button className="btn btn-success form-control" onClick={() => loadMore()}>Více</button>}
        </PageBase>
    )
}
