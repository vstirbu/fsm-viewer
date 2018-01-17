// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      
      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module;

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({5:[function(require,module,exports) {
/* global document, XMLSerializer */

const css = `
html,
body,
svg {
  font: 300 14px 'Helvetica Neue', Helvetica;
  margin: 0;
  padding: 0;
}

.node circle,
.node .choice,
.node .state {
  stroke: #333;
  fill: #fff;
}

.edgePath path {
  stroke: #333;
  fill: #333;
}

.node circle.initial,
.node circle.final {
  fill: #333;
}
`;

module.exports = getSVGString;

function getSVGString (svgNode) {
  svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");
  appendCSS(css, svgNode);

  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink="); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, "xlink:href"); // Safari NS namespace fix
  svgString = svgString.replace(new RegExp(document.location.href, 'g'), ''); // Fix marker urls to be local scope

  return svgString;
};

function getCSSStyles(parentElement) {
  var selectorTextArr = [];

  // Add Parent element Id and Classes to the list
  selectorTextArr.push("#" + parentElement.id);
  for (var c = 0; c < parentElement.classList.length; c++)
    if (!contains("." + parentElement.classList[c], selectorTextArr))
      selectorTextArr.push("." + parentElement.classList[c]);

  // Add Children element Ids and Classes to the list
  var nodes = parentElement.getElementsByTagName("*");
  for (var i = 0; i < nodes.length; i++) {
    var id = nodes[i].id;
    if (!contains("#" + id, selectorTextArr)) selectorTextArr.push("#" + id);

    var classes = nodes[i].classList;
    for (var c = 0; c < classes.length; c++)
      if (!contains("." + classes[c], selectorTextArr))
        selectorTextArr.push("." + classes[c]);
  }

  // Extract CSS Rules
  var extractedCSSText = "";
  for (var i = 0; i < document.styleSheets.length; i++) {
    var s = document.styleSheets[i];

    try {
      if (!s.cssRules) continue;
    } catch (e) {
      if (e.name !== "SecurityError") throw e; // for Firefox
      continue;
    }

    var cssRules = s.cssRules;
    for (var r = 0; r < cssRules.length; r++) {
      if (contains(cssRules[r].selectorText, selectorTextArr))
        extractedCSSText += cssRules[r].cssText;
    }
  }

  return extractedCSSText;
}

function contains(str, arr) {
  return arr.indexOf(str) === -1 ? false : true;
}

function appendCSS(cssText, element) {
  var styleElement = document.createElement("style");
  styleElement.setAttribute("type", "text/css");
  styleElement.innerHTML = cssText;
  var refNode = element.hasChildNodes() ? element.children[0] : null;
  element.insertBefore(styleElement, refNode);
}

},{}],6:[function(require,module,exports) {
/* global document, Image, btoa */

module.exports = svgString2Image;

function svgString2Image(svgString, width, height, format, callback) {
  var format = format ? format : "png";

  var imgsrc =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  var image = new Image();
  image.onload = function() {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(function(blob) {
      var filesize = Math.round(blob.length / 1024) + " KB";
      if (callback) callback(blob, filesize);
    });
  };

  image.src = imgsrc;
}

},{}],3:[function(require,module,exports) {
/* global d3, fetch */

// based on http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177

const getSVGString = require('./utils/svg');
const svgString2Image = require('./utils/png');

const png = (svg, width, height) => {
  var svgString = getSVGString(svg.node());
  svgString2Image(svgString, 2 * width, 2 * height, "png", post); // passes Blob and filesize String to the callback
}

const svg = (uri) => post(uri)(getSVGString(d3.select('svg').node()));

const post = uri => (body, filesize) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  fetch(uri, {
    method: 'POST',
    body: body
  })
  .then(() => console.log('image sent to vscode extension'))
  .catch(err => console.log(err));

}

module.exports = {
  png,
  svg
};

},{"./utils/svg":5,"./utils/png":6}],8:[function(require,module,exports) {
/* global dagreD3 */

module.exports = function choice(parent, bbox, node) {
  // const w = (bbox.width * Math.SQRT2) / 2;
  // const h = (bbox.height * Math.SQRT2) / 2;
  const w = 10;
  const h = 10;
  const points = [
    { x: 0, y: -h },
    { x: -w, y: 0 },
    { x: 0, y: h },
    { x: w, y: 0 }
  ];
  const shapeSvg = parent
    .insert("polygon", ":first-child")
    .attr(
      "points",
      points
        .map(function(p) {
          return p.x + "," + p.y;
        })
        .join(" ")
    )
    .classed("choice", true);

  node.intersect = function(p) {
    return dagreD3.intersect.polygon(node, points, p);
  };

  return shapeSvg;
}

},{}],9:[function(require,module,exports) {
/* global dagreD3 */

module.exports = function final(parent, bbox, node) {
  const r = 15;
  const outerShapeSvg = parent
    .insert("circle", ":first-child")
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("r", r);

  parent
    .append("circle")
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("r", r - 5)
    .classed("final", true);

  node.intersect = function(point) {
    return dagreD3.intersect.circle(node, r, point);
  };

  return outerShapeSvg;
}

},{}],10:[function(require,module,exports) {
/* global dagreD3 */

module.exports = function initial(parent, bbox, node) {
  const r = 15;
  const shapeSvg = parent
    .insert("circle", ":first-child")
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("r", r)
    .classed("initial", true);

  node.intersect = function(point) {
    return dagreD3.intersect.circle(node, r, point);
  };

  return shapeSvg;
}

},{}],11:[function(require,module,exports) {
/* global dagreD3 */

module.exports = function state(parent, bbox, node) {
  const shapeSvg = parent
    .insert("rect", ":first-child")
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("width", bbox.width)
    .attr("height", bbox.height)
    .classed('state', true);

  node.intersect = function(point) {
    return dagreD3.intersect.rect(node, point);
  };

  return shapeSvg;
}

},{}],7:[function(require,module,exports) {
module.exports = {
  scalingFactor
};

function scalingFactor(g, svg) {
  const graphHeight = g.graph().height;
  const svgHeight = svg.attr("height");
  const verticalScale =
    graphHeight > svgHeight ? svgHeight / (graphHeight + 20) : 1;

  const graphWidth = g.graph().width;
  const svgWidth = svg.attr("width");
  const horizontalScale =
    graphWidth > svgWidth ? svgWidth / (graphWidth + 20) : 1;

  return Math.min(horizontalScale, verticalScale);
}

},{}],4:[function(require,module,exports) {
/* global window, d3, dagreD3 */
const choice = require('./shapes/choice');
const final = require('./shapes/final');
const initial = require('./shapes/initial');
const state = require('./shapes/state');

const { scalingFactor } = require('./tools');

module.exports = renderer;
function renderer(spec) {
  // Create a new directed graph
  const g = new dagreD3.graphlib.Graph().setGraph({});

  g.setNode(spec.initial, { shape: "initial", label: "" });

  spec.final.forEach(state => {
    g.setNode(state, { shape: "final", label: "" });
  });

  spec.states.forEach(state => {
    g.setNode(state.name, { shape: "state", label: state.name });
  });

  spec.choices.forEach(state => {
    g.setNode(state, { shape: "choice", label: "" });
  });

  spec.events.forEach(event => {
    if (Array.isArray(event.from)) {
      event.from.forEach(from => {
        g.setEdge(from, event.to, { label: event.label, arrowhead: "vee" });
      });
    } else {
      g.setEdge(event.from, event.to, { label: event.label, arrowhead: "vee" });
    }
  });

  const svg = d3.select("svg");
  const inner = svg.select("g");

  // Set up zoom support
  const zoom = d3.zoom().on("zoom", function() {
    inner.attr("transform", d3.event.transform);
  });
  svg.call(zoom);

  // Fit svg to preview window
  svg.attr("height", window.innerHeight - 5);
  svg.attr("width", window.innerWidth - 5);

  // Create the renderer
  const render = new dagreD3.render();

  // Custom shapes
  render.shapes().initial = initial;
  render.shapes().final = final;
  render.shapes().state = state;
  render.shapes().choice = choice;

  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  // Determine scaling factor
  const initialScale = scalingFactor(g, svg);

  // Center the graph
  const width = (svg.attr("width") - g.graph().width * initialScale) / 2;
  const height = (svg.attr("height") - g.graph().height * initialScale) / 2;

  svg.call(
    zoom.transform,
    d3.zoomIdentity.translate(width, height).scale(initialScale)
  );
}

},{"./shapes/choice":8,"./shapes/final":9,"./shapes/initial":10,"./shapes/state":11,"./tools":7}],2:[function(require,module,exports) {
/* global window, d3 */

module.exports = function resize() {
  const svg = d3.select("svg");

  svg.attr("height", window.innerHeight - 5);
  svg.attr("width", window.innerWidth - 5);
}

},{}],1:[function(require,module,exports) {
/* global window */

window.extension = {
  export: require('./export'),
  renderer: require('./renderer'),
  resize: require('./tools/resize')
};

},{"./export":3,"./renderer":4,"./tools/resize":2}]},{},[1])