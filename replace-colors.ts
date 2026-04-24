import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src', 'pages');

function replaceColors(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  content = content.replace(/ring-blue-500/g, 'ring-slate-900');
  content = content.replace(/text-blue-600/g, 'text-slate-900');
  content = content.replace(/bg-blue-50 /g, 'bg-slate-50 border border-slate-200 ');
  content = content.replace(/bg-blue-100/g, 'bg-slate-100');
  content = content.replace(/text-blue-800/g, 'text-slate-800');
  content = content.replace(/text-blue-500/g, 'text-slate-600');
  content = content.replace(/hover:text-blue-800/g, 'hover:text-slate-700');
  
  // Also tame the red/green/amber into monochrome or very muted
  content = content.replace(/bg-green-100/g, 'bg-slate-100 border border-slate-200');
  content = content.replace(/text-green-700/g, 'text-slate-700');
  content = content.replace(/text-green-800/g, 'text-slate-800');
  content = content.replace(/hover:bg-green-200/g, 'hover:bg-slate-200');
  
  content = content.replace(/bg-amber-100/g, 'bg-slate-100 border border-slate-200');
  content = content.replace(/text-amber-700/g, 'text-slate-700');
  content = content.replace(/text-amber-800/g, 'text-slate-800');
  
  content = content.replace(/bg-red-100/g, 'bg-slate-100 border border-slate-200');
  content = content.replace(/text-red-700/g, 'text-slate-700');
  content = content.replace(/text-red-800/g, 'text-slate-800');
  content = content.replace(/hover:bg-red-200/g, 'hover:bg-slate-200');

  // Specific exceptions
  content = content.replace(/text-red-500/g, 'text-slate-900');
  content = content.replace(/text-red-600/g, 'text-slate-900');
  
  // Muted variants
  content = content.replace(/text-green-500/g, 'text-slate-600');
  content = content.replace(/text-amber-500/g, 'text-slate-600');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    replaceColors(path.join(dir, file));
  }
});

console.log('Colors replaced successfully!');
