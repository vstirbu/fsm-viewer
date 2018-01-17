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
    const rendererUrl = fileUrl(this.context.asAbsolutePath('dist/index.js'));

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
        extension.renderer(JSON.parse('${JSON.stringify(this.spec)}'));

        window.addEventListener('resize', extension.resize);

        if (${Boolean(this._media)}) {
          const media = '${this._media}';
          extension.export.svg(media);
        }
        </script>
      </body>
    </html>
    ` : 'file does not contain fsm';

    console.log('provide content');
    return content;
  }

  get onDidChange() {
    return this._onDidChange.event;
  }

  update(uri, token) {
    const editor = vscode.window.activeTextEditor;

    const text = editor.document.getText();
    try {
      this.spec = parser(text);
      vscode.commands.executeCommand('setContext', 'fsm-viewer:canExport', true);
      this._onDidChange.fire(uri);
    } catch (e) {
      vscode.commands.executeCommand('setContext', 'fsm-viewer:canExport', false);
      delete this.spec;
      this._onDidChange.fire(uri);
      console.log(e);
    }
  }

  save({ uri, media }) {
    this._media = media;
    this._onDidChange.fire(uri);
    console.log('triggered save');
  }

  clean() {
    console.log('cleaning');
    delete this._media;
  }
}
