import { useCallback, useMemo, useState } from "react"
import { KebabMenu } from "../../../../_template/src/Base/Components/Table"
import { Link } from "./Link"
import { UpdateLink } from "../Mutations/Update"
import { DeleteButton } from "../Mutations/Delete"
import { formatDateTime } from "../../../../_template/src/Base/Components/Attribute"

// Sortable column definitions with field mapping
const SORTABLE_COLUMNS = {
    name: { label: "Název", field: "name" },
    nameEn: { label: "Anglický název", field: "nameEn" },
    minScore: { label: "Minimum", field: "minScore" },
    maxScore: { label: "Maximum", field: "maxScore" },
    changed: { label: "Změněno", field: "lastchange" },
}

const buildExamTableDef = () => ({
    name: {
        label: "Název",
        sortable: true,
        field: "name",
        component: ({ row }) => (
            <td>
                <Link item={row}>{row?.name || "Bez názvu"}</Link>
            </td>
        ),
    },
    nameEn: {
        label: "Anglický název",
        sortable: true,
        field: "nameEn",
        component: ({ row }) => <td>{row?.nameEn || ""}</td>,
    },
    parent: {
        label: "Nadřazená zkouška",
        sortable: false,
        component: ({ row }) => (
            <td>
                {row?.parent ? <Link item={row.parent}>{row.parent?.name || row.parent?.id}</Link> : row?.parentId || ""}
            </td>
        ),
    },
    minScore: {
        label: "Minimum",
        sortable: true,
        field: "minScore",
        component: ({ row }) => <td>{row?.minScore ?? ""}</td>,
    },
    maxScore: {
        label: "Maximum",
        sortable: true,
        field: "maxScore",
        component: ({ row }) => <td>{row?.maxScore ?? ""}</td>,
    },
    changed: {
        label: "Změněno",
        sortable: true,
        field: "lastchange",
        component: ({ row }) => <td>{row?.lastchange ? formatDateTime(row.lastchange) : ""}</td>,
    },
    tools: {
        label: "Nástroje",
        sortable: false,
        component: ({ row }) => (
            <td>
                <KebabMenu
                    actions={[
                        {
                            children: (
                                <Link
                                    className="btn btn-sm btn-outline-secondary border-0 text-start w-100"
                                    item={row}
                                >
                                    Detail
                                </Link>
                            ),
                        },
                        {
                            children: (
                                <UpdateLink
                                    className="btn btn-sm btn-outline-secondary border-0 text-start w-100"
                                    item={row}
                                    action="edit"
                                >
                                    Editovat
                                </UpdateLink>
                            ),
                        },
                        {
                            children: (
                                <DeleteButton
                                    className="btn btn-sm btn-outline-danger border-0 text-start w-100"
                                    item={row}
                                    rbacitem={row?.rbacobject}
                                >
                                    Smazat
                                </DeleteButton>
                            ),
                        },
                    ]}
                />
            </td>
        ),
    },
})

// Sort indicator component
const SortIndicator = ({ direction }) => {
    if (!direction) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>
    return <span style={{ marginLeft: 4 }}>{direction === "asc" ? "↑" : "↓"}</span>
}

// Sortable header component
const SortableHeader = ({ label, sortable, columnKey, field, currentSort, onSort }) => {
    if (!sortable) {
        return <th>{label}</th>
    }

    const isActive = currentSort?.field === field
    const direction = isActive ? currentSort.direction : null

    return (
        <th
            style={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => onSort(columnKey, field)}
            title={`Seřadit podle ${label}`}
        >
            {label}
            <SortIndicator direction={direction} />
        </th>
    )
}

// Table row component
const TableRow = ({ row, table_def }) => (
    <tr>
        {Object.keys(table_def).map((name) => {
            const Cell = table_def[name].component
            return <Cell key={name} row={row} name={name} />
        })}
    </tr>
)

// Client-side sorting function for already loaded data
const sortDataLocally = (data, sortField, direction) => {
    if (!sortField || !data) return data

    return [...data].sort((a, b) => {
        let aVal = a?.[sortField]
        let bVal = b?.[sortField]

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return direction === "asc" ? 1 : -1
        if (bVal == null) return direction === "asc" ? -1 : 1

        // Handle dates
        if (sortField === "lastchange") {
            aVal = new Date(aVal).getTime()
            bVal = new Date(bVal).getTime()
        }

        // Handle numbers
        if (typeof aVal === "number" && typeof bVal === "number") {
            return direction === "asc" ? aVal - bVal : bVal - aVal
        }

        // Handle strings (alphabetically)
        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        const cmp = aStr.localeCompare(bStr, "cs") // Czech locale for proper sorting
        return direction === "asc" ? cmp : -cmp
    })
}

export const Table = ({ data, onSort, loadAllAndSort, hasMore }) => {
    const [sortState, setSortState] = useState(null)
    const [isLoadingAll, setIsLoadingAll] = useState(false)

    const tableDef = useMemo(() => buildExamTableDef(), [])

    const handleSort = useCallback(async (columnKey, field) => {
        // Determine new direction
        let newDirection
        if (sortState?.field === field) {
            // Toggle direction
            newDirection = sortState.direction === "asc" ? "desc" : "asc"
        } else {
            // New column, default to descending for dates, ascending for text
            newDirection = field === "lastchange" ? "desc" : "asc"
        }

        const newSortState = { field, direction: newDirection }
        setSortState(newSortState)

        // If there's more data to load and we have a loadAllAndSort function, use it
        if (hasMore && loadAllAndSort) {
            setIsLoadingAll(true)
            try {
                await loadAllAndSort(field, newDirection)
            } finally {
                setIsLoadingAll(false)
            }
        } else if (onSort) {
            // Server-side sorting via restart
            onSort(field, newDirection)
        }
    }, [sortState, hasMore, loadAllAndSort, onSort])

    // Sort data locally based on current sort state (or keep original order if no sort)
    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return []
        if (!sortState) return data
        return sortDataLocally(data, sortState.field, sortState.direction)
    }, [data, sortState])

    if (!data || data.length === 0) return null

    return (
        <div className="table-responsive">
            {isLoadingAll && (
                <div className="alert alert-info py-1 mb-2">
                    Načítám všechny položky pro řazení...
                </div>
            )}
            <table className="table table-striped">
                <thead>
                    <tr>
                        {Object.keys(tableDef).map((key) => (
                            <SortableHeader
                                key={key}
                                label={tableDef[key].label}
                                sortable={tableDef[key].sortable}
                                columnKey={key}
                                field={tableDef[key].field || key}
                                currentSort={sortState}
                                onSort={handleSort}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row) => (
                        <TableRow key={row?.id} row={row} table_def={tableDef} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}