import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

  // Buscar el index.html en el directorio correcto
  let indexPath = './index.html';
  
  if (!fs.existsSync(indexPath)) {
    // Intenta buscar en el directorio raíz del proyecto
    indexPath = path.resolve(process.cwd(), '../index.html');
    
    if (!fs.existsSync(indexPath)) {
      console.error('No se pudo encontrar el archivo index.html');
      process.exit(1);
    }
  }
  
  console.log(`Actualizando archivo: ${indexPath}`);
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Modificar para buscar solo "Dashboard" en lugar de "Dashboard de Tiempo"
  indexContent = indexContent.replace(
    /(<h1 class="page-title" id="pageTitle">Dashboard)([^<]*)/,
    `$1 ${version}$2`
  );
  
  fs.writeFileSync(indexPath, indexContent);
  
  // Commit y tag
  execSync('git add index.html');
  execSync(`git commit -m "Actualizado para versión ${version}"`);
  execSync(`git tag -a ${version} -m "Versión ${version}"`);
  
  console.log(`\nVersión ${version} creada exitosamente!`);
  console.log(`\nPara subir los cambios, ejecuta manualmente:`);
  console.log(`git push origin main && git push origin ${version}`);

} catch (error) {
  console.error(`Error al crear la versión: ${error.message}`);
  process.exit(1);
}