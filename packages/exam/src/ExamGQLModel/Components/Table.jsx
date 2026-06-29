import { useMemo } from "react"
import { KebabMenu } from "../../../../_template/src/Base/Components/Table"
import { Link } from "./Link"
import { UpdateLink } from "../Mutations/Update"
import { DeleteButton } from "../Mutations/Delete"
import { formatDateTime } from "../../../../_template/src/Base/Components/Attribute"

const buildExamTableDef = () => ({
    name: {
        label: "Název",
        component: ({ row }) => (
            <td>
                <Link item={row}>{row?.name || "Bez názvu"}</Link>
            </td>
        ),
    },
    nameEn: {
        label: "Anglický název",
        component: ({ row }) => <td>{row?.nameEn || ""}</td>,
    },
    parent: {
        label: "Nadřazená zkouška",
        component: ({ row }) => (
            <td>
                {row?.parent ? <Link item={row.parent}>{row.parent?.name || row.parent?.id}</Link> : row?.parentId || ""}
            </td>
        ),
    },
    minScore: {
        label: "Minimum",
        component: ({ row }) => <td>{row?.minScore ?? ""}</td>,
    },
    maxScore: {
        label: "Maximum",
        component: ({ row }) => <td>{row?.maxScore ?? ""}</td>,
    },
    changed: {
        label: "Změněno",
        component: ({ row }) => <td>{row?.lastchange ? formatDateTime(row.lastchange) : ""}</td>,
    },
    tools: {
        label: "Nástroje",
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

const SortButton = ({ column, sortConfig, onSort }) => {
    const isActive = sortConfig.column === column
    const direction = isActive ? sortConfig.direction : null

    const getIcon = () => {
        if (!isActive) return "↕"
        return direction === "asc" ? "↑" : "↓"
    }
    const getTitle = () => {
        if (!isActive) return "Seřadit vzestupně"
        return direction === "asc" ? "Seřadit sestupně" : "Zrušit řazení"
    }

    return (
        <button
            type="button"
            className={`btn btn-sm ${isActive ? "btn-primary" : "btn-outline-secondary"} ms-1`}
            onClick={() => onSort(column)}
            title={getTitle()}
            style={{ padding: "0.1rem 0.3rem", fontSize: "0.75rem" }}
        >
            {getIcon()}
        </button>
    )
}

const SortableTableHeader = ({ tableDef, sortConfig, onSort }) => {
    const sortableColumns = ["name", "nameEn", "minScore", "maxScore", "changed"]

    return (
        <thead>
            <tr>
                {Object.entries(tableDef).map(([key, { label }]) => (
                    <th key={key}>
                        {label}
                        {sortableColumns.includes(key) && (
                            <SortButton
                                column={key}
                                sortConfig={sortConfig}
                                onSort={onSort}
                            />
                        )}
                    </th>
                ))}
            </tr>
        </thead>
    )
}

const TableRow = ({ row, table_def }) => (
    <tr>
        {Object.keys(table_def).map((name) => {
            const Cell = table_def[name].component
            return <Cell key={name} row={row} name={name} />
        })}
    </tr>
)

export const Table = ({ data, sortConfig = { column: null, direction: null }, onSort }) => {
    const tableDef = useMemo(() => buildExamTableDef(), [])

    if (!data || data.length === 0) return null

    return (
        <div className="table-responsive">
            <table className="table table-striped">
                <SortableTableHeader
                    tableDef={tableDef}
                    sortConfig={sortConfig}
                    onSort={onSort}
                />
                <tbody>
                    {data.map((row) => (
                        <TableRow key={row?.id} row={row} table_def={tableDef} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
