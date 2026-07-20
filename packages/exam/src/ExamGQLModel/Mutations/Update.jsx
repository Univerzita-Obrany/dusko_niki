import {
    UpdateButton as BaseUpdateButton,
    UpdateDialog as BaseUpdateDialog,
    UpdateLink as BaseUpdateLink
} from "../../../../_template/src/Base/Mutations/Update";

import {
    MediumEditableContent,
    ReadItemURI,
    UpdateItemURI,
} from "../Components";
import {ExamEditForm} from "../Pages/ExamEditForm"

import { UpdateAsyncAction } from "../Queries";
import { CreateButton } from "./Create";
import { useNavigate } from "react-router-dom";

/**
 * Výchozí obsah pro dialog úprav. Obaluje `MediumEditableContent` a
 * připravuje data pro vytvoření nové "části", ačkoliv pro ni nevykresluje žádné ovládací prvky.
 *
 * @param {Object} props - Vlastnosti komponenty, očekává se, že obsahují objekt `item`.
 * @param {Object} props.item - Položka entity, která se upravuje.
 * @returns {JSX.Element}
 */
const DefaultContent = (props) => {

    const item = props?.item || {};

    const navigate = useNavigate();

    const typeId =
        item?.typeId || item?.type?.id || null;

    const planId =
        item?.planId || item?.plan?.id || null;

    const canCreatePart =
        Boolean(typeId && planId);

    const partDraft = {
        name: item?.name
            ? `${item.name} - part`
            : "Nový part",
        parentId: item?.id,
        typeId,
        planId,
    };

    return (
        <MediumEditableContent {...props}>


        </MediumEditableContent>
    );
};

const mutationAsyncAction = UpdateAsyncAction;

const permissions = {
    oneOfRoles: [],
    mode: "absolute",
};

// ALTERNATIVE, CHECK GQLENDPOINT
// const permissions = {
//     oneOfRoles: ["administrátor", "personalista"],
//     mode: "item",
// }

/**
 * Wrapper nad `BaseUpdateLink`, který poskytuje výchozí vlastnosti pro úpravu entity zkoušky.
 * Nastavuje výchozí URI vzor pro odkaz na úpravu a aplikuje předdefinovaná oprávnění.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {string} [props.uriPattern=UpdateItemURI] - URI vzor pro odkaz.
 * @param {Object} props.item - Položka, která se má upravit.
 * @param {React.ReactNode} props.children - Obsah odkazu.
 * @returns {JSX.Element} Komponenta `BaseUpdateLink` nakonfigurovaná pro zkoušky.
 */
export const UpdateLink = ({
    uriPattern = UpdateItemURI,
    ...props
}) => {
    return (
        <BaseUpdateLink
            {...props}
            uriPattern={uriPattern}
            {...permissions}
        />
    );
};

/**
 * Wrapper nad `BaseUpdateDialog` nakonfigurovaný pro úpravu entity zkoušky.
 * Poskytuje výchozí obsah a mutační akci.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {React.ComponentType} [props.DefaultContent=DefaultContent] - Komponenta pro vykreslení obsahu dialogu.
 * @param {Function} [props.mutationAsyncAction=mutationAsyncAction] - Asynchronní akce pro provedení úpravy.
 * @returns {JSX.Element} Komponenta `BaseUpdateDialog`.
 */
export const UpdateDialog = ({
    DefaultContent: DefaultContent_ = DefaultContent,
    mutationAsyncAction:
        mutationAsyncAction_ = mutationAsyncAction,
    ...props
}) => {
    return (
        <BaseUpdateDialog
            {...props}
            DefaultContent={DefaultContent_}
            mutationAsyncAction={
                mutationAsyncAction_
            }
            {...permissions}
        />
    );
};

/**
 * Wrapper nad `BaseUpdateButton` pro zkoušky. Toto tlačítko otevírá dialog pro úpravu entity.
 * Je předkonfigurováno s výchozími komponentami a akcemi pro proces úprav.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {React.ComponentType} [props.DefaultContent=DefaultContent] - Obsah pro dialog úprav.
 * @param {React.ComponentType} [props.Dialog=UpdateDialog] - Komponenta dialogu, která se má použít.
 * @param {Function} [props.mutationAsyncAction=mutationAsyncAction] - Asynchronní akce pro úpravu.
 * @param {string} [props.uriPattern=ReadItemURI] - URI pro navigaci po úspěšné úpravě.
 * @returns {JSX.Element} Komponenta `BaseUpdateButton`.
 */
export const UpdateButton = ({
    DefaultContent: DefaultContent_ = DefaultContent,
    Dialog = UpdateDialog,
    mutationAsyncAction:
        mutationAsyncAction_ = mutationAsyncAction,
    uriPattern = ReadItemURI,
    ...props
}) => {
    return (
        <BaseUpdateButton
            {...props}
            DefaultContent={DefaultContent_}
            Dialog={Dialog}
            mutationAsyncAction={
                mutationAsyncAction_
            }
            uriPattern={uriPattern}
            {...permissions}
        />
    );
};

/**
 * Komponenta, která slouží jako tělo stránky pro úpravy.
 * Obaluje své potomky komponentou `ExamEditForm`, která poskytuje editační kontext a logiku.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {React.ReactNode} props.children - Obsah, který se má vykreslit uvnitř formuláře.
 * @returns {JSX.Element} `ExamEditForm` s potomky.
 */
export const UpdateBody = ({ children }) => {

    return (
        <ExamEditForm>
            {children}
        </ExamEditForm>
    );
};