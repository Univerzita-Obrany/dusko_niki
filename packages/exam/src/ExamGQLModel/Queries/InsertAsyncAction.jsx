import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared";
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2";


const InsertMutationStr = `
mutation examInsert(
	$id: UUID!,
	$name: String,
	$nameEn: String,
	$description: String,
	$descriptionEn: String,
	$minScore: Int,
	$maxScore: Int,
	$typeId: UUID,
	$parentId: UUID,
	$planId: UUID
) {
	examInsert(
		exam: {
			name: $name,
			nameEn: $nameEn,
			description: $description,
			descriptionEn: $descriptionEn,
			minScore: $minScore,
			maxScore: $maxScore,
			typeId: $typeId,
			parentId: $parentId,
			planId: $planId,
			id: $id
		}
  ) {
		__typename
		... on ExamGQLModel { id lastchange name }
		... on ExamGQLModelInsertError { __typename msg }
  }
}
`

const InsertMutation = createQueryStrLazy(`${InsertMutationStr}`)
export const InsertAsyncAction = createAsyncGraphQLAction2(InsertMutation)