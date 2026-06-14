import { useMemo } from "react"
import { Table as BaseTable, KebabMenu } from "../../../../_template/src/Base/Components/Table"
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

export const Table = ({ data }) => {
    const sortedData = useMemo(() => {
        return [...(data || [])].sort((left, right) => {
            const leftTime = left?.lastchange ? new Date(left.lastchange).getTime() : 0
            const rightTime = right?.lastchange ? new Date(right.lastchange).getTime() : 0
            return rightTime - leftTime
        })
    }, [data])

    const tableDef = useMemo(() => buildExamTableDef(), [])

    return <BaseTable data={sortedData} table_def={tableDef} />
}