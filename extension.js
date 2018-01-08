// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const FsmContentProvider = require('./content-provider');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  const registerCommand = vscode.commands.registerCommand;
  const previewUri = vscode.Uri.parse('fsm-viewer://authority/view');

  const provider = new FsmContentProvider(context);

  const registration = vscode.workspace.registerTextDocumentContentProvider('fsm-viewer', provider);

  const disposable = registerCommand('fsm-viewer.view', () => {
    vscode.commands
    .executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'FSM Viewer')
    .then(success => {}, reason => vscode.window.showErrorMessage(reason));
  });

  vscode.workspace.onDidChangeTextDocument(e => {
    if (e.document === vscode.window.activeTextEditor.document) {
      provider.update(previewUri);
    }
  });

  vscode.window.onDidChangeTextEditorSelection(e => {
    if (e.textEditor === vscode.window.activeTextEditor) {
      provider.update(previewUri);
    }
  });

  vscode.window.onDidChangeActiveTextEditor(e => {
    provider.update(previewUri);
  });

  context.subscriptions.push(disposable, registration);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
