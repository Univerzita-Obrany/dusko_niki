import { URIRoot } from "../../uriroot";
import { registerLink } from "../../../../_template/src/Base/Components/Link";
import { ProxyLink } from "../../../../_template/src/Base/Components/ProxyLink";

/** @const {string} modelURI - Base URI for the ExamGQLModel. */
const modelURI = `${URIRoot}/ExamGQLModel`
/** @const {string} ListURI - URI for listing exam items. */
export const ListURI = `${modelURI}/list/`;
/** @const {string} CreateURI - URI for creating a new exam item. */
export const CreateURI = `${modelURI}/create/`;
/** @const {string} ReadURI - Base URI for viewing an exam item. */
export const ReadURI = `${modelURI}/view/`;
/** @const {string} UpdateURI - Base URI for editing an exam item. */
export const UpdateURI = `${modelURI}/edit/`;
/** @const {string} DeleteURI - Base URI for deleting an exam item. */
export const DeleteURI = `${modelURI}/delete/`;

/** @const {string} LinkURI - Default URI for a link, pointing to the read view. */
export const LinkURI = ReadURI;
/** @const {string} VectorItemsURI - URI for the list view, used for collections of items. */
export const VectorItemsURI = ListURI;

/** @const {string} idParam - URL parameter for the item ID. */
const idParam = ":id"
/** @const {string} ReadItemURI - Full URI for viewing a specific item by its ID. */
export const ReadItemURI = `${LinkURI}${idParam}`;
/** @const {string} UpdateItemURI - Full URI for editing a specific item by its ID. */
export const UpdateItemURI = `${UpdateURI}${idParam}`;
/** @const {string} DeleteItemURI - Full URI for deleting a specific item by its ID. */
export const DeleteItemURI = `${DeleteURI}${idParam}`;

/**
 * Renders a `ProxyLink` to a specific action page for an exam entity.
 *
 * The target URL is dynamically constructed using the item's `id` and the specified action.
 * The link text defaults to the item's name or ID if no children are provided.
 *
 * @param {Object} props - The properties for the `Link` component.
 * @param {Object} props.item - The exam entity object, must contain an `id`.
 * @param {string} [props.LinkURI=ReadURI] - The base URI for the link.
 * @param {string} [props.action='view'] - The action to perform (e.g., 'view', 'edit'). This replaces 'view' in the `LinkURI_`.
 * @param {React.ReactNode} [props.children] - The content to display inside the link. If not provided, it defaults to the item's name or ID.
 *
 * @returns {JSX.Element} A `ProxyLink` component.
 *
 * @example
 * // Link to the view page for an exam
 * const exam = { id: 'abc-123', name: 'Final Exam' };
 * <Link item={exam} />
 * // Renders: <ProxyLink to="/.../ExamGQLModel/view/abc-123">Final Exam</ProxyLink>
 *
 * @example
 * // Link to the edit page for an exam with custom text
 * <Link item={exam} action="edit">Edit Exam</Link>
 * // Renders: <ProxyLink to="/.../ExamGQLModel/edit/abc-123">Edit Exam</ProxyLink>
 *
 * @remarks
 * - This component utilizes `ProxyLink` to ensure consistent link behavior, including parameter preservation and conditional reloads.
 *
 * @see ProxyLink - The base component used for rendering the link.
 */
export const Link = ({ item, LinkURI: LinkURI_ = LinkURI, action="view", children, ...props}) => {
    const targetURI = LinkURI_.replace('view', action);
    return <ProxyLink to={targetURI + item?.id} {...props}>{children || item?.fullname || item?.name || item?.id || "Nevim"}</ProxyLink>
    // return <BaseUI.Link item={item} />
    // return <a>{children || item?.fullname || item?.name || item?.id || "Nevim"}</a>
}

registerLink('ExamGQLModel', Link)