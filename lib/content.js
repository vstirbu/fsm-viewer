const parser = require('fsm2dot');
const vscode = require('vscode');

const prepareText = require('./prepare-text');

const getSpec = context => {
  const editor = vscode.window.activeTextEditor;

  const text = editor.document.getText();

  try {
    const prepared = prepareText(text, context);
    const spec = parser(prepared);

    vscode.commands.executeCommand('setContext', 'fsmViewer:canExport', true);

    return spec;
  } catch (error) {
    console.log(error);
    vscode.commands.executeCommand('setContext', 'fsmViewer:canExport', false);
    return;
  }
};

const content = context => {
  const getUrl = relative =>
    vscode.Uri.file(context.asAbsolutePath(relative)).with({
      scheme: 'vscode-resource'
    });

  const d3Url = getUrl('node_modules/d3/build/d3.min.js');
  const dagreD3Url = getUrl('node_modules/dagre-d3/dist/dagre-d3.min.js');
  const rendererUrl = getUrl('dist/index.js');
  const cssUrl = getUrl('viewer/viewer.css');

  const spec = getSpec(context);

  return spec !== undefined
    ? `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>State Diagram</title>

    <script src="${d3Url}"></script>
    <script src="${dagreD3Url}"></script>
    <link rel="stylesheet" href="${cssUrl}">
    <script src="${rendererUrl}"></script>
  </head>
  <body>
    <svg width=600 height=400><g/></svg>

    <script>
    let vscode;

    extension.renderer(JSON.parse('${JSON.stringify(spec)}'));

    window.addEventListener('resize', extension.resize);

    window.addEventListener('message', event => {
      if (vscode === undefined) {
        vscode = acquireVsCodeApi();
      }

      switch (event.data.command) {
        case 'save':
          vscode.postMessage({
            command: 'svg',
            content: extension.export.svg()
          });
        break;
        default:
      }
    });
    </script>
  </body>
</html>
`
    : 'File does not contain a FSM';
};

module.exports = content;
