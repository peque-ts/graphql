import { ClassDeclaration } from '../interfaces';

export function isClass(clazz: ClassDeclaration): boolean {
  return /^\s*class/.test(clazz.toString());
}
