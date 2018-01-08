const vscode = require('vscode');
const fileUrl = require('file-url');
const parser = require('fsm2dot');

module.exports = class FsmContentProvider{
  constructor(context) {
    this._onDidChange = new vscode.EventEmitter();
    this.context = context;
    this.update();
  }

  provideTextDocumentContent(uri, token) {
    const d3Url = fileUrl(this.context.asAbsolutePath('node_modules/d3/build/d3.min.js'));
    const dagreD3Url = fileUrl(this.context.asAbsolutePath('node_modules/dagre-d3/dist/dagre-d3.min.js'));
    const rendererUrl = fileUrl(this.context.asAbsolutePath('viewer/renderer.js'));

    const cssUrl = fileUrl(this.context.asAbsolutePath('viewer/viewer.css'));

    const content = this.spec ? `<!doctype html>
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
        renderer(JSON.parse('${JSON.stringify(this.spec)}'));

        window.addEventListener('resize', resize);
        </script>
      </body>
    </html>
    ` : 'file does not contain fsm';

    return content;
  }

  get onDidChange() {
    return this._onDidChange.event;
  }

  update(uri) {
    const editor = vscode.window.activeTextEditor;
    const text = editor.document.getText();
    try {
      this.spec = parser(text);
      this._onDidChange.fire(uri);
    } catch (e) {
      console.log(e);
    }
  }
}
