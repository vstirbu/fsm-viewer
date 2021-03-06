# fsm-viewer

View finite state machines using [fsm-as-promised](https://github.com/vstirbu/fsm-as-promised) library as UML diagrams in VSCode

[![](http://vsmarketplacebadge.apphb.com/version/vstirbu.fsm-viewer.svg)](https://marketplace.visualstudio.com/itemdetails?itemName=vstirbu.fsm-viewer)
[![](http://vsmarketplacebadge.apphb.com/installs/vstirbu.fsm-viewer.svg)](https://marketplace.visualstudio.com/itemdetails?itemName=vstirbu.fsm-viewer)
[![](http://vsmarketplacebadge.apphb.com/trending-monthly/vstirbu.fsm-viewer.svg)](https://marketplace.visualstudio.com/itemdetails?itemName=vstirbu.fsm-viewer)

## Features

### Language support

The extension is able to process JavaScript files that contain the following proposed features:

- class properties
- object rest spread

and extensions:

- jsx

### View

Edit the file containing finite state machine implemented using the [fsm-as-promised](https://github.com/vstirbu/fsm-as-promised) library in the editor. Open the Command Palette and type `View FSM as UML diagram`. The extension will render the corresponding UML diagram in a new panel.

![feature X](images/docs/view-diagram.gif)

### Export SVG

The command is available while the FSM Preview editor is active.

![export svg](images/docs/export-svg.png)
