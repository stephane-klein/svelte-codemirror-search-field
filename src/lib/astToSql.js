function quote(value) {
  return value.replace(/'/g, "''");
}

export function astToSql(ast) {
  if (!ast) return null;
  switch (ast.type) {
    case "tag":
      return `'${quote(ast.name)}' = ANY(tags)`;
    case "quoted":
    case "unknown":
      return `description ILIKE '%${quote(ast.text)}%'`;
    case "and": {
      const left = astToSql(ast.left);
      const right = astToSql(ast.right);
      if (!left || !right) return null;
      return `(${left} AND ${right})`;
    }
    case "or": {
      const left = astToSql(ast.left);
      const right = astToSql(ast.right);
      if (!left || !right) return null;
      return `(${left} OR ${right})`;
    }
    case "not": {
      const operand = astToSql(ast.operand);
      if (!operand) return null;
      return `(NOT ${operand})`;
    }
    default:
      return null;
  }
}
