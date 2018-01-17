// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const FsmContentProvider = require('./lib/content-provider');
const fetchMedia = require('./lib/media');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  const registerCommand = vscode.commands.registerCommand;
  const previewUri = vscode.Uri.parse('fsm-viewer:authority/view');

  const provider = new FsmContentProvider(context);

  const registration = vscode.workspace.registerTextDocumentContentProvider('fsm-viewer', provider);

  const view = registerCommand('fsm-viewer.view', () => {
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
    console.log(vscode.window.activeTextEditor.document.uri === previewUri);
    provider.update(previewUri);
  });

  const save = registerCommand('fsm-viewer.save', () => {
    fetchMedia({
      format: 'svg',
      mediaCallback: (err, body) => {
        provider.clean();

        if (err) {
          vscode.window.showErrorMessage('SVG export failed');
        } else {
          vscode.window.showInputBox({
            prompt: 'Output file',
            placeHolder: 'output.svg'
          }).then((input) => {
            try {
              fs.writeFileSync(path.join(vscode.workspace.rootPath, input), body);
            } catch (e) {
              console.log('not a file');
            }
          });
        }
      }
    }).then(mediaUrl => {
      provider.save({
        uri: previewUri,
        media: mediaUrl
      });
    });
  });

  context.subscriptions.push(view, save, registration);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
  console.log('deactivate');
}
exports.deactivate = deactivate;
