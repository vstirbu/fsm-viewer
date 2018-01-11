/* global d3 */

// based on http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177

const getSVGString = require('./utils/svg');
const svgString2Image = require('./utils/png');

const png = (svg, width, height) => {
  var svgString = getSVGString(svg.node());
  svgString2Image(svgString, 2 * width, 2 * height, "png", saveFn); // passes Blob and filesize String to the callback

  function saveFn(dataBlob) {
    // saveAs(dataBlob, "D3 vis exported to PNG.png"); // FileSaver.js function

    // pass blob to extension
  }
}

const svg = (svg) => {
  const svgString = getSVGString(svg.node());

  // pass svg string to extension
  return svgString;
}

module.exports = {
  png,
  svg
};
