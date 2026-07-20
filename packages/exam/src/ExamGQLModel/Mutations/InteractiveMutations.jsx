import { CardCapsule, VectorItemsURI } from "../Components"
import { CreateButton, CreateLink } from "./Create"
import { UpdateButton, UpdateLink } from "./Update"
import { ProxyLink } from "../../../../_template/src/Base/Components/ProxyLink"
import { DeleteButton } from "./Delete"

/**
 * Komponenta, která vykresluje odkaz na hlavní stránku se seznamem (`VectorItemsURI`).
 * Obaluje `ProxyLink`, aby ve výchozím nastavení zachovala parametry `search` a `hash`.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {React.ReactNode} props.children - Obsah, který se má zobrazit uvnitř odkazu.
 * @param {boolean} [props.preserveHash=true] - Zda zachovat URL hash.
 * @param {boolean} [props.preserveSearch=true] - Zda zachovat URL search parametry.
 * @returns {JSX.Element} Komponenta `ProxyLink`.
 */
export const PageLink = ({ children, preserveHash = true, preserveSearch = true, ...props }) => {
    return (
        <ProxyLink
            to={VectorItemsURI}
            preserveHash={preserveHash}
            preserveSearch={preserveSearch}
            {...props}
        >
            {children}
        </ProxyLink>
    );
};

/**
 * Komponenta, která sdružuje běžné mutační akce pro entitu.
 * Zobrazuje sadu tlačítek pro zobrazení, úpravu, vytvoření a smazání entit
 * souvisejících s poskytnutou položkou, vše zabalené v `CardCapsule`.
 *
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Položka entity, pro kterou se vykreslují ovládací prvky mutací.
 * @returns {JSX.Element} `CardCapsule` obsahující interaktivní mutační tlačítka.
 */
export const InteractiveMutations = ({ item }) => {
    return (
        <CardCapsule item={item} title="Nástroje">
            <PageLink className="btn btn-outline-success">Stránka</PageLink>
            <UpdateLink className="btn btn-outline-success" item={item}>Upravit</UpdateLink>
            <UpdateButton className="btn btn-outline-success" item={item}>Upravit Dialog</UpdateButton>
            <CreateButton className="btn btn-outline-success" rbacitem={{}} parentItem={item}>Vytvořit nový</CreateButton>
            <DeleteButton className="btn btn-outline-danger" item={item}>Odstranit</DeleteButton>
        </CardCapsule>
    )
}