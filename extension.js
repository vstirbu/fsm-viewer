// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const getWebviewContent = require('./lib/content');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('fsmViewer.view', () => {
      const _disposables = [];

      const panel = vscode.window.createWebviewPanel(
        'fsmViewer',
        'FSM Viewer',
        vscode.ViewColumn.Two,
        {
          // Enable scripts in the webview
          enableScripts: true
        }
      );

      vscode.workspace.onDidChangeTextDocument(
        e => {
          if (e.document === vscode.window.activeTextEditor.document) {
            panel.webview.html = getWebviewContent(context);
          }
        },
        null,
        _disposables
      );

      vscode.window.onDidChangeTextEditorSelection(
        e => {
          if (e.textEditor === vscode.window.activeTextEditor) {
            panel.webview.html = getWebviewContent(context);
          }
        },
        null,
        _disposables
      );

      vscode.window.onDidChangeActiveTextEditor(
        e => {
          console.log(e);
          // panel.webview.html = getWebviewContent(context);
        },
        null,
        _disposables
      );

      panel.onDidDispose(
        () => {
          console.log('panel closed');

          while (_disposables.length) {
            const item = _disposables.pop();
            if (item) {
              item.dispose();
            }
          }
        },
        null,
        context.subscriptions
      );

      panel.webview.html = getWebviewContent(context);
    })
  );

  /*
  const save = registerCommand('fsm-viewer.save', () => {
    fetchMedia({
      format: 'svg',
      mediaCallback: (err, body) => {
        provider.clean();

        if (err) {
          vscode.window.showErrorMessage('SVG export failed');
        } else {
          vscode.window
            .showInputBox({
              prompt: 'Relative to project root',
              placeHolder: 'Type the output file name'
            })
            .then(input => {
              try {
                fs.writeFileSync(
                  path.join(vscode.workspace.rootPath, input),
                  body
                );
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
  */
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
  console.log('deactivate');
}
exports.deactivate = deactivate;
