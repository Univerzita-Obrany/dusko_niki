import { createQueryStrLazy } from "@hrbolek/uoisfrontend-gql-shared";
import { createAsyncGraphQLAction2 } from "../../../../dynamic/src/Core/createAsyncGraphQLAction2";
import { ItemActions } from "../../../../dynamic/src/Store/ItemSlice";

const DeleteMutationStr = `
mutation examDelete($id: UUID!, $lastchange: DateTime!) {
  examDelete(exam: {id: $id, lastchange: $lastchange}) {
    ...ExamGQLModelDeleteError
  }
}

fragment ExamGQLModelDeleteError on ExamGQLModelDeleteError {
  __typename
  Entity {
    ...DeleteEntityFragment
  }
  msg
  failed
}

fragment DeleteEntityFragment on ExamGQLModel {
  __typename
  id
  lastchange
  name
}
`

const deleteMiddleware = (result) => async (dispatch, getState, next) => {
    const dataRoot = result && typeof result === "object" && "data" in result && result.data != null
        ? result.data
        : result;

    const deleteResult = dataRoot?.examDelete;

    if (deleteResult) {
        if (deleteResult.failed) {
            const err = new Error(deleteResult.msg || "Delete operation failed");
            err.errors = deleteResult;
            throw err;
        }

        if (deleteResult.Entity?.id) {
            dispatch(ItemActions.item_delete({ id: deleteResult.Entity.id }));
        }
    }

    return next(result);
};

const DeleteMutation = createQueryStrLazy(`${DeleteMutationStr}`)
export const DeleteAsyncAction = createAsyncGraphQLAction2(DeleteMutation, deleteMiddleware)