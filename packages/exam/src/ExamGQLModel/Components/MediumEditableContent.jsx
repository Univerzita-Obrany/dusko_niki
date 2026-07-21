/**
 * @fileoverview Komponenta pro editaci středně detailního obsahu zkoušky.
 * Poskytuje formulářové prvky pro úpravu názvu, popisu, bodů a semestru.
 * @module ExamGQLModel/Components/MediumEditableContent
 */

import { Input } from "../../../../_template/src/Base/FormControls/Input"
import { Label } from "../../../../_template/src/Base/FormControls/Label"
import { SemesterSelect } from "./SemesterSelect"

/**
 * Zakáže scrollování na vstupních polích typu number.
 * Používá se jako handler pro událost onWheel.
 * @param {Event} e - Událost kolečka myši.
 */
const disableScroll = (e) => e.target.blur()

/**
 * Komponenta pro editaci obsahu zkoušky.
 * Zobrazuje formulářové prvky pro úpravu názvu, anglického názvu, minimálního a maximálního počtu bodů,
 * popisu a anglického popisu. Pro hlavní exam (bez parentId) zobrazuje také výběr semestru.
 *
 * @component
 * @param {Object} props - Vlastnosti komponenty.
 * @param {Object} props.item - Původní data zkoušky.
 * @param {string} [props.item.id] - Jedinečný identifikátor zkoušky.
 * @param {string} [props.item.name] - Název zkoušky.
 * @param {string} [props.item.nameEn] - Anglický název zkoušky.
 * @param {number} [props.item.minScore] - Minimální počet bodů.
 * @param {number} [props.item.maxScore] - Maximální počet bodů.
 * @param {string} [props.item.description] - Popis zkoušky.
 * @param {string} [props.item.descriptionEn] - Anglický popis zkoušky.
 * @param {string} [props.item.parentId] - ID nadřazené zkoušky (pokud je to část).
 * @param {Object} [props.draft] - Rozpracovaná verze dat (draft) pro editaci.
 * @param {Function} [props.onChange] - Callback volaný při změně hodnoty vstupního pole.
 * @param {Function} [props.onBlur] - Callback volaný při opuštění vstupního pole.
 * @param {React.ReactNode} [props.children] - Dětské komponenty k vykreslení.
 * @returns {JSX.Element} Formulářová komponenta pro editaci zkoušky.
 *
 * @example
 * const examItem = { id: "123", name: "Zkouška z matematiky", minScore: 0, maxScore: 100 };
 *
 * <MediumEditableContent
 *   item={examItem}
 *   onChange={(e) => handleChange(e)}
 *   onBlur={(e) => handleBlur(e)}
 * />
 */
export const MediumEditableContent = ({ item, draft, onChange=(e)=>null, onBlur=(e)=>null, children}) => {
    const source = draft ?? item ?? {}
    return (
        <>
        {/* defaultValue={item?.name|| "Název"}  */}
            <Input id={"name"} label={"Název"} className="form-control" value={source?.name ?? ""} placeholder={"Název"} onChange={onChange} />
            <Input id={"nameEn"} label={"Anglický název"} className="form-control" value={source?.nameEn ?? ""} placeholder={"Anglický název"} onChange={onChange} />
            <Input id={"minScore"} type="number" label={"Minimální počet bodů"} className="form-control" value={source?.minScore ?? ""} placeholder={"Minimální počet bodů"} onChange={onChange} onWheel={disableScroll} />
            <Input id={"maxScore"} type="number" label={"Maximální počet bodů"} className="form-control" value={source?.maxScore ?? ""} placeholder={"Maximální počet bodů"} onChange={onChange} onWheel={disableScroll} />

            {/*
              * Select pro výběr semestru - pouze pro hlavní exam (bez parentId).
              * Předává se onChange callback, který SemesterSelect použije v create mode
              * pro uložení vybraného planId do draftu. V edit mode SemesterSelect
              * provádí GraphQL mutace přímo.
              */}
            {!source?.parentId && <SemesterSelect item={item} onChange={onChange} />}

            <Label id="description" title="Popis">
                <textarea
                    id="description"
                    className="form-control"
                    rows={4}
                    value={source?.description ?? ""}
                    onChange={onChange}
                    onBlur={onBlur}
                />
            </Label>

            <Label id="descriptionEn" title="Anglický popis">
                <textarea
                    id="descriptionEn"
                    className="form-control"
                    rows={4}
                    value={source?.descriptionEn ?? ""}
                    onChange={onChange}
                    onBlur={onBlur}
                />
            </Label>

            {children}
        </>
    )
}
