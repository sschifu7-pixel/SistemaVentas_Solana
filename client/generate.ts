import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';
import * as path from 'path';
import * as fs from 'fs';

const idlPath = path.resolve(__dirname, '../idl/pos_solana.json');
const outputPath = path.resolve(__dirname, 'src/generated');

if (!fs.existsSync(idlPath)) {
  console.error(`IDL no encontrado en: ${idlPath}`);
  process.exit(1);
}

const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
console.log(`Cargando IDL para programa: ${idl.name || idl.metadata?.name}`);

const rootNode = rootNodeFromAnchor(idl);
const codama = createFromRoot(rootNode);

console.log(`Renderizando cliente TypeScript con Codama en: ${outputPath}`);
codama.accept(renderVisitor(outputPath));

console.log('¡Cliente TypeScript generado exitosamente con Codama!');

