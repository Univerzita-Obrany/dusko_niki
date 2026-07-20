import { UpdateAsyncAction } from "../Queries";
import { MediumEditableContent } from "./MediumEditableContent";
import { useEditAction } from "../../../../dynamic/src/Hooks/useEditAction";
import { useCallback } from "react";
import { useGQLEntityContext } from "../../../../_template/src/Base/Helpers/GQLEntityProvider";


/**
 * Komponenta, která poskytuje formulář pro úpravu entity s explicitními tlačítky
 * pro potvrzení nebo zrušení změn. Využívá hook `useEditAction` pro správu
 * konceptu (draft) stavu a logiku potvrzení.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Entita, která se má upravovat.
 * @param {React.ReactNode} props.children - Další potomci, kteří se mají vykreslit uvnitř formuláře.
 * @returns {JSX.Element} Formulář s editovatelným obsahem a tlačítky pro uložení/zrušení.
 */
export const ConfirmEdit = ({ item, children }) => {
    const { run , error, loading, entity, data, onChange: contextOnChange, onBlur: contextOnBlur } = useGQLEntityContext()
    
    /**
     * @deprecated This function appears to be unused.
     */
    const localOnMutationEvent = useCallback((mutationHandler, notifyHandler) => async (e) => {
        const newItem = { ...item, [e.target.id]: e.target.value }
        const newEvent = { target: { value: newItem } }
        
        await notifyHandler(newEvent)
        return await mutationHandler(e)
    })

    const {
        draft,
        dirty,
        onChange, 
        onBlur,
        onCancel,
        onConfirm,
    } = useEditAction(UpdateAsyncAction, item, {mode: "confirm"})

    /**
     * Zpracuje potvrzení úprav. Zavolá `onConfirm` z `useEditAction` a v případě
     * úspěchu aktualizuje entitu v `GQLEntityContext`.
     *
     * @returns {Promise<any>} Výsledek potvrzovací akce.
     */
    const handleConfirm = useCallback(async () => {
        const result = await onConfirm();
        console.log("ConfirmEdit handleConfirm result", result, "draft", draft)
        if (result) {
            const event = { target: { value: result } };
            // důležité: použij params z kontextu (provider si je drží jako "poslední vars")
            await contextOnChange(event);
        }
        return result;
    }, [onConfirm, contextOnChange]);


    return (
        <MediumEditableContent item={item} onChange={onChange} onBlur={onBlur} >
            {children}
            <hr />
            {/* <pre>{JSON.stringify(item, null, 2)}</pre> */}
            <button 
                className="btn btn-warning form-control" 
                onClick={onCancel}
                disabled={!dirty || loading}
            >
                Zrušit změny
            </button>
            <button 
                className="btn btn-primary form-control" 
                onClick={handleConfirm}
                disabled={!dirty || loading}
            >
                Uložit změny
            </button>
        </MediumEditableContent>
    )
}