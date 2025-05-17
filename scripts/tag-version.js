import { execSync } from 'child_process';
import fs from 'fs';

// Obtener la versión de la línea de comandos
const version = process.argv[2];

if (!version || !version.startsWith('v')) {
  console.error('Por favor, especifica una versión que comience con "v", por ejemplo: v20');
  process.exit(1);
}

try {
  // Verificar si el tag ya existe
  try {
    execSync(`git rev-parse ${version}`, { stdio: 'ignore' });
    console.error(`El tag ${version} ya existe. Por favor, utiliza otra versión.`);
    process.exit(1);
  } catch (e) {
    // El tag no existe, podemos continuar
  }

  // Actualizar la versión en el HTML para que refleje qué versión es
  const indexPath = './index.html';
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Buscar la línea donde está el título del Dashboard
  indexContent = indexContent.replace(
    /(Dashboard de Tiempo)[^<]*/,
    `Dashboard de Tiempo ${version} `
  );
  
  fs.writeFileSync(indexPath, indexContent);
  
  // Commit y tag
  execSync('git add index.html');
  execSync(`git commit -m "Actualizado para versión ${version}"`);
  execSync(`git tag -a ${version} -m "Versión ${version}"`);
  
  console.log(`\nVersión ${version} creada exitosamente!`);
  console.log(`\nPara subir los cambios, ejecuta:`);
  console.log(`git push origin main && git push origin ${version}`);

} catch (error) {
  console.error(`Error al crear la versión: ${error.message}`);
  process.exit(1);
}