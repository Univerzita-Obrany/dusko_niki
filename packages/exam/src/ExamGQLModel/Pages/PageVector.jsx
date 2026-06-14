
import { ReadPageAsyncAction } from "../Queries"
import { useInfiniteScroll } from "../../../../dynamic/src/Hooks/useInfiniteScroll"
import { PageBase } from "./PageBase"
import { Table } from "../Components/Table"
import { Filter } from "../Components/Filter"
import { FilterButton, ResetFilterButton } from "../../../../_template/src/Base/FormControls/Filter"
import { useSearchParams } from "react-router"
import { useCallback, useEffect, useRef } from "react"
import { useMemo } from "react"
import { AsyncStateIndicator } from "../../../../_template/src/Base/Helpers/AsyncStateIndicator"
import { Collapsible } from "../../../../_template/src/Base/FormControls/Collapsible"


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

//
const filterParameterName = "gr_where"
export const PageVector = ({ children, queryAsyncAction = ReadPageAsyncAction }) => {

    const [sp] = useSearchParams();

    const whereFromUrl = useMemo(() => safeParseWhere(sp, filterParameterName), [sp.toString()]);

    const { items, loading, error, hasMore, sentinelRef, loadMore, restart } = useInfiniteScroll(
        {
            asyncAction: queryAsyncAction,
            actionParams: { skip: 0, limit: 25, where: whereFromUrl },
            // reset: whereFromUrl
        }
    )

    // Track current sort for loadAllAndSort
    const currentSortRef = useRef(null)

    useEffect(() => {
        const params = { skip: 0, limit: 25, where: whereFromUrl }
        restart(params)
    }, [whereFromUrl]);

    // Handle sort change - restart with new orderby
    const handleSort = useCallback((field, direction) => {
        currentSortRef.current = { field, direction }
        const orderby = direction === "desc" ? `-${field}` : field
        const params = { skip: 0, limit: 25, where: whereFromUrl, orderby }
        restart(params)
    }, [whereFromUrl, restart])

    // Load all items for sorting - keeps loading until hasMore is false
    const loadAllAndSort = useCallback(async (field, direction) => {
        currentSortRef.current = { field, direction }
        const orderby = direction === "desc" ? `-${field}` : field

        // First restart with high limit to load everything
        const params = { skip: 0, limit: 1000, where: whereFromUrl, orderby }
        await restart(params)

        // Continue loading if there's more
        let iterations = 0
        const maxIterations = 50 // Safety limit

        // Small delay to let state update
        await new Promise(r => setTimeout(r, 100))

        // Keep loading until no more data
        while (iterations < maxIterations) {
            iterations++
            const result = await loadMore()
            if (!result) break
            // Small delay between loads
            await new Promise(r => setTimeout(r, 50))
        }
    }, [whereFromUrl, restart, loadMore])


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

            <Table
                data={items}
                onSort={handleSort}
                loadAllAndSort={loadAllAndSort}
                hasMore={hasMore}
            />

            <AsyncStateIndicator error={error}  loading={loading} text="Nahrávám další..." />

            {hasMore && <div ref={sentinelRef} style={{ height: 80, backgroundColor: "lightgray" }} />}
            {hasMore && <button className="btn btn-success form-control" onClick={() => loadMore()}>Více</button>}
        </PageBase>
    )
}

