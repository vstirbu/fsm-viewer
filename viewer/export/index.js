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
