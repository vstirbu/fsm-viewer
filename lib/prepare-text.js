const babel = require('@babel/core');
const generator = require('@babel/generator').default;

/**
 * Determines if node is ImportDeclaration
 *
 * import … from "…";
 *
 * import "…";
 *
 * @param {object} node
 * @returns {boolean}
 */
const isImportDeclaration = node => {
  return (
    node.type === 'ImportDeclaration' &&
    // [null, 'value'].includes(node.importKind) &&
    node.source &&
    ['StringLiteral', 'Literal'].includes(node.source.type) &&
    node.source.value === 'fsm-as-promised'
  );
};

/**
 * Determines if node is CallExpression
 *
 * require("…");
 *
 * @param {object} node
 * @returns {boolean}
 */
const isRequireCallExpression = node => {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments[0] &&
    node.arguments[0].value === 'fsm-as-promised' &&
    ['StringLiteral', 'Literal'].includes(node.arguments[0].type)
  );
};

module.exports = (code, context) => {
  let name;
  let target;

  const { ast } = babel.transformSync(code, {
    code: false,
    ast: true,
    cwd: context.extensionPath,
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-transform-react-jsx'
    ]
  });

  babel.traverse(ast, {
    enter: path => {
      const { node, parent } = path;

      if (isImportDeclaration(node)) {
        name = node.specifiers[0].local.name;
        path.stop();
      }

      if (isRequireCallExpression(node)) {
        name = parent.id.name;
        path.stop();
      }
    }
  });

  if (name === undefined) {
    throw new Error('NoFSMFound');
  }

  babel.traverse(ast, {
    CallExpression: path => {
      const { node, parent } = path;

      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === name &&
        node.arguments[0].type === 'ObjectExpression'
      ) {
        target = node;
        path.stop();
      }

      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.name === name &&
        node.callee.property.name === 'create'
      ) {
        target = node;
        path.stop();
      }
    }
  });

  if (target === undefined) {
    throw new Error('NoFSMFound');
  }

  return `const _ = require('fsm-as-promised');\n_(${
    generator(target.arguments[0]).code
  });`;
};
