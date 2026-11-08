import catalogJson from "../../../data/catalog/catalog.json";
import type { CatalogFile, CatalogProgram } from "./types";

const catalog = catalogJson as CatalogFile;

export function getCatalog(): CatalogFile {
  return catalog;
}

export function listPrograms(): CatalogProgram[] {
  return catalog.programs;
}

export function getProgram(id: string): CatalogProgram | undefined {
  return catalog.programs.find((program) => program.id === id || program.planCode === id);
}
