/* global document, XMLSerializer */

const css = `svg {
  font: 300 14px 'Helvetica Neue', Helvetica;
  margin: 0;
  padding: 0;
}

.final .outer,
.choice,
.state {
  stroke: #333;
  fill: #fff;
}

.edgePath path {
  stroke: #333;
  fill: #333;
}

.initial circle,
.final .inner {
  fill: #333;
}

.final .label,
.initial .label {
  transform: translate(30px, 0);
  font-weight: bolder;
}

.label .state-name {
  border-bottom: 1px solid #333;
  margin-bottom: 3px;
  text-align: center;
  font-weight: bolder;
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
