import { useCallback } from "react";
import { useMemo } from "react";

import { UpdateAsyncAction } from "../Queries";
import { CreateDelayer, ErrorHandler, LoadingSpinner } from "@hrbolek/uoisfrontend-shared";
import { MediumEditableContent } from "./MediumEditableContent";
import { ReadItemURI } from "./Link";
import { useEditAction } from "../../../../dynamic/src/Hooks/useEditAction";
import { useGQLEntityContext, AsyncActionProvider } from "../../../../_template/src/Base/Helpers/GQLEntityProvider";

/**
 * @deprecated This component appears to be an older or alternative implementation for live editing.
 * It uses `AsyncActionProvider` and `LiveEditWrapper` to handle data changes.
 * Prefer using `ExamEditForm` for auto-saving or `ConfirmEdit` for manual saving.
 *
 * Interaktivní React komponenta pro live editaci entity zkoušky.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {React.ReactNode} props.children - Potomci, kteří se mají vykreslit uvnitř editačního kontextu.
 * @param {Function} [props.asyncAction=UpdateAsyncAction] - Asynchronní akce pro provedení úpravy.
 * @returns {JSX.Element} Komponenta poskytující kontext pro live editaci.
 */
export const LiveEdit_ = ({ children, asyncAction=UpdateAsyncAction}) => {
    const { onChange, onBlur, item } = useGQLEntityContext()
    return (
        <AsyncActionProvider 
            item={item} 
            queryAsyncAction={asyncAction}
            options={{deferred: true, network: true}}
            onChange={onChange}
            onBlur={onBlur}
        >
            <LiveEditWrapper item={item}>
                {children}
                {/* <hr />
                <pre>{JSON.stringify(item, null, 2)}</pre> */}
            </LiveEditWrapper>
        </AsyncActionProvider>
    )
}

/**
 * Interní wrapper komponenta pro `LiveEdit_`.
 * Získává editační funkce z `useGQLEntityContext` a propojuje je s `MediumEditableContent`.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Entita, která se upravuje.
 * @param {React.ReactNode} props.children - Potomci pro zobrazení v `MediumEditableContent`.
 * @returns {JSX.Element}
 */
const LiveEditWrapper = ({ item, children }) => {
    const { run , error, loading, entity, data, onChange, onBlur } = useGQLEntityContext()
    
    const handleEvent = useCallback((handler) => async (e) => {
        const {id, value} = e?.target || {}
        if (id === undefined || value === undefined) return 
        if (item?.[id] === value) {
            return;
        }
        const newItem = { ...item, [e.target.id]: e.target.value }
        const newEvent = { target: { value: newItem } }
        // console.log("LiveEditWrapper localOnChange start e", e, '=>', newEvent)
        // const result = await delayer(()=>onChange(newEvent))
        const result = await handler(newEvent)
        // console.log("LiveEditWrapper localOnChange end e", e, '=>', newItem, '=>', result)
        return result
    }, [item])

    const bindedOnChange = useMemo(() => handleEvent(onChange), [onChange, handleEvent])
    const bindedOnBlur = useMemo(() => handleEvent(onBlur), [onBlur, handleEvent])

    return (
        <MediumEditableContent item={item} onChange={bindedOnChange} onBlur={bindedOnBlur} >
            {children}
            {/* <hr />
            <pre>{JSON.stringify(item, null, 2)}</pre> */}
        </MediumEditableContent>
    )
}


/**
 * Komponenta pro editaci formuláře s explicitním potvrzením.
 * Využívá `useEditAction` ke správě stavu konceptu (draft) a zobrazuje tlačítka
 * "Uložit změny" a "Zrušit změny".
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Původní entita, která se upravuje.
 * @param {React.ReactNode} props.children - Další potomci (obvykle formulářová pole), kteří se mají vykreslit.
 * @param {Function} [props.asyncMutationAction=UpdateAsyncAction] - Asynchronní akce, která se má provést při uložení.
 * @returns {JSX.Element} Formulář pro editaci s ovládacími tlačítky.
 */
export const LiveEdit = ({ item, children, asyncMutationAction=UpdateAsyncAction }) => {
    // const { run , error, loading, entity, data, onChange: contextOnChange, onBlur: contextOnBlur } = useGQLEntityContext()
    const {
        draft,
        dirty,
        loading: saving,
        onChange, 
        onBlur,
        onCancel,
        onConfirm,
    } = useEditAction(asyncMutationAction, item, {
        mode: "confirm", 
        // onCommit: contextOnChange
    })

    /**
     * Zpracuje potvrzení úprav.
     * @returns {Promise<any>} Výsledek potvrzovací akce.
     */
    const handleConfirm = useCallback(async () => {
        const result = await onConfirm()
        return result
    }, [onConfirm])

    return (
        
        <MediumEditableContent item={item} draft={draft} onChange={onChange} onBlur={() => null} >
            {saving && <LoadingSpinner/>}
            {children}
            <hr />
            <button
                className="btn btn-warning form-control"
                onClick={onCancel}
                disabled={!dirty || saving}
            >
                Zrušit změny
            </button>
            <button
                className="btn btn-primary form-control"
                onClick={handleConfirm}
                disabled={!dirty || saving}
            >
                Uložit změny
            </button>
        </MediumEditableContent>
        
    )
}